import { findIndex, findLastIndex, range, slice } from "lodash/fp";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { ViewProps } from "~/interface/samplesView";
import { MustHaveId } from "~/interface/shared";
import {
  getDiscoveryProjects,
  getDiscoverySamples,
  getDiscoveryVisualizations,
  getDiscoveryWorkflowRuns,
} from "./discovery_api";

class ObjectCollection<T extends MustHaveId> {
  _displayName: string;
  domain: string;
  entries: { [id: number]: T } | Record<string, never>;
  fetchDataCallback: (
    params,
  ) => Promise<{ fetchedObjects: T[]; fetchedObjectIds: number[] }>;
  constructor(
    // domain of the collection (my data, all data, public, snapshot)
    domain: string,
    // function to fetch data from server
    // should take the following parameters:
    // - domain: my_data, public, all_data, snapshot
    // - ...conditions: any callback specific filters
    // - limit: maximum number of results
    // - offset: number of results to skip
    // - listAllIds: boolean that indicates if it should retrieve
    //   a list of all possible IDs
    fetchDataCallback: ObjectCollection<T>["fetchDataCallback"],
    // name of the view: mostly used for debug
    displayName = "",
  ) {
    this.domain = domain;
    this.entries = {};
    this.fetchDataCallback = fetchDataCallback;
    this._displayName = displayName;
  }

  createView = (viewProps: ViewProps) => {
    return new ObjectCollectionView(this, viewProps);
  };

  update = (entry: T) => {
    this.entries[entry.id] = entry;
  };
}

class ObjectCollectionView<T extends MustHaveId> {
  _activePromises: object;
  _collection: ObjectCollection<T>;
  _conditions: ViewProps["conditions"];
  _displayName: ViewProps["displayName"];
  _loading: boolean;
  _onViewChange: ViewProps["onViewChange"];
  _orderedIds: number[];
  _pageSize: ViewProps["pageSize"];
  constructor(
    collection: ObjectCollection<T>,
    {
      // conditions: Extra conditions to use for this view.
      // These will be sent to the fetchDataCallback of the corresponding collection when requesting new data.
      conditions = {},
      // pageSize: Size of the page for this view.
      pageSize = 50,
      // callbacks to notify the client when changes occur
      // onViewChange: triggered when the view finishes loading new object ids (the full list of ids in the view)
      onViewChange = null,
      // name of the view: mostly used for debug
      displayName = "",
    },
  ) {
    this._orderedIds = null;
    this._loading = true;
    this._collection = collection;
    this._conditions = conditions;
    this._activePromises = {};
    this._pageSize = pageSize;
    this._displayName = displayName;
    this._onViewChange = onViewChange;
  }

  get loaded() {
    return (this._orderedIds || [])
      .filter(id => id in this._collection.entries)
      .map(id => this._collection.entries[id]);
  }

  get length() {
    return (this._orderedIds || []).length;
  }

  get displayName() {
    return this._displayName;
  }

  get entries() {
    return this._collection.entries;
  }

  get = (id: number) => this._collection.entries[id];

  getIds = () => this._orderedIds || [];

  getViewLength = () => {
    return Object.keys(this._collection.entries).length;
  };

  getIntermediateIds = ({ id1, id2 }: { id1: number; id2: number }) => {
    const start = findIndex(v => v === id1 || v === id2, this._orderedIds);
    const end = findLastIndex(v => v === id1 || v === id2, this._orderedIds);
    return slice(start, end + 1, this._orderedIds);
  };

  isLoading = () => this._loading;

  reset = ({
    conditions,
    loadFirstPage = false,
    logLoadTime = false,
  }: {
    conditions?: ObjectCollectionView<T>["_conditions"];
    loadFirstPage?: boolean;
    logLoadTime?: boolean;
  } = {}) => {
    this._orderedIds = null;
    this._loading = true;
    this._conditions = conditions;
    this._activePromises = {};

    if (loadFirstPage) {
      this.loadPage(0, logLoadTime);
    }
  };

  loadPage = async (pageNumber: number, logLoadTime = false) => {
    const indices = {
      startIndex: pageNumber,
      stopIndex: this._pageSize * (1 + pageNumber) - 1,
    };

    const startLoad = new Date();
    const objectRows = await this.handleLoadObjectRows(indices);
    const endLoad = new Date();

    if (logLoadTime) {
      trackEvent(
        ANALYTICS_EVENT_NAMES.DISCOVERY_VIEW_TABLE_PAGE_LOADED,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        {
          domain: this._collection.domain,
          displayName: this._displayName,
          allIdsCount: this._orderedIds.length,
          loadTimeInMilleseconds: endLoad.valueOf() - startLoad.valueOf(),
          ...this._conditions,
        },
      );
    }

    return objectRows;
  };

  handleLoadObjectRows = async ({
    startIndex,
    stopIndex,
  }: {
    startIndex: number;
    stopIndex: number;
  }) => {
    // Make sure we do not load the same information twice
    // If conditions change (see reset), then the active promises tracker is emptied
    // CAVEAT: we use a key based on 'startIndex,stopindex', thus, this only works if the request are exactly the same
    // Asking for a subset of an existing request (e.g. asking for 0,49 and then 10,19) will still lead to redundant requests
    const key = [startIndex, stopIndex];
    // @ts-expect-error Type 'number[]' cannot be used as an index type.
    if (this._activePromises[key]) {
      // @ts-expect-error Type 'number[]' cannot be used as an index type.
      return this._activePromises[key];
    } else {
      const promiseLoadObjectRows = this.fetchObjectRows({
        startIndex,
        stopIndex,
      });
      // @ts-expect-error Type 'any[]' cannot be used as an index type.
      this._activePromises[key] = promiseLoadObjectRows;
      const result = await promiseLoadObjectRows;
      // @ts-expect-error Type 'any[]' cannot be used as an index type.
      delete this._activePromises[key];
      return result;
    }
  };

  fetchObjectRows = async ({
    startIndex,
    stopIndex,
  }: {
    startIndex: number;
    stopIndex: number;
  }) => {
    const domain = this._collection.domain;

    const minStopIndex = this._orderedIds
      ? Math.min(this._orderedIds.length - 1, stopIndex)
      : stopIndex;
    let missingIdxs = range(startIndex, minStopIndex + 1);
    if (this._orderedIds) {
      missingIdxs = missingIdxs.filter(
        (idx: $TSFixMe) => !(this._orderedIds[idx] in this._collection.entries),
      );
    }
    if (missingIdxs.length > 0) {
      // currently loads using limit and offset
      // could eventually lead to redundant fetches if data is not requested in regular-sized chunks
      const minNeededIdx = missingIdxs[0];
      const maxNeededIdx = missingIdxs[missingIdxs.length - 1];
      const { fetchedObjects, fetchedObjectIds } =
        await this._collection.fetchDataCallback({
          domain,
          ...this._conditions,
          limit: maxNeededIdx - minNeededIdx + 1,
          offset: minNeededIdx,
          listAllIds: this._orderedIds === null,
        });

      fetchedObjects.forEach((object: $TSFixMe) => {
        this._collection.entries[object.id] = object;
      });

      // We currently load the ids of ALL objects in the view. This allows using a simple solution to
      // handle the select all options.
      // It currently works with minimal performance impact, but might need to review in the future, as the number
      // of objects in these views increases
      if (fetchedObjectIds) {
        this._orderedIds = fetchedObjectIds;
        this._loading = false;
        this._onViewChange && this._onViewChange();
      } else {
        this._loading = false;
      }
    }

    return range(startIndex, minStopIndex + 1)
      .filter(idx => idx in this._orderedIds)
      .map(idx => this._collection.entries[this._orderedIds[idx]]);
  };
}

class DiscoveryDataLayer {
  amrWorkflowRuns: $TSFixMe;
  benchmarkWorkflowRuns: ObjectCollection<any>;
  cgWorkflowRuns: $TSFixMe;
  domain: string;
  longReadMngsSamples: $TSFixMe;
  projects: $TSFixMe;
  samples: $TSFixMe;
  visualizations: $TSFixMe;
  constructor(domain: string) {
    // TODO: Move domain to conditions object
    this.domain = domain;

    this.projects = new ObjectCollection(domain, this.fetchProjects);
    this.samples = new ObjectCollection(domain, this.fetchSamples);
    this.longReadMngsSamples = new ObjectCollection(domain, this.fetchSamples);
    this.visualizations = new ObjectCollection(
      domain,
      this.fetchVisualizations,
    );
    this.cgWorkflowRuns = new ObjectCollection(domain, this.fetchWorkflowRuns);
    this.amrWorkflowRuns = new ObjectCollection(domain, this.fetchWorkflowRuns);
    this.benchmarkWorkflowRuns = new ObjectCollection(
      domain,
      this.fetchWorkflowRuns,
    );
  }

  fetchSamples = async (
    params: $TSFixMe,
  ): Promise<{
    fetchedObjects: $TSFixMe[];
    fetchedObjectIds: number[];
  }> => {
    const { samples: fetchedObjects, sampleIds: fetchedObjectIds } =
      await getDiscoverySamples(params);
    return { fetchedObjects, fetchedObjectIds };
  };

  fetchProjects = async (params: $TSFixMe) => {
    const { projects: fetchedObjects, projectIds: fetchedObjectIds } =
      await getDiscoveryProjects(params);
    return { fetchedObjects, fetchedObjectIds };
  };

  fetchVisualizations = async (params: $TSFixMe) => {
    const {
      visualizations: fetchedObjects,
      visualizationIds: fetchedObjectIds,
    } = await getDiscoveryVisualizations(params);
    return { fetchedObjects, fetchedObjectIds };
  };

  fetchWorkflowRuns = async (params: $TSFixMe) => {
    const { workflowRuns: fetchedObjects, workflowRunIds: fetchedObjectIds } =
      await getDiscoveryWorkflowRuns(params);
    return { fetchedObjects, fetchedObjectIds };
  };
}

export { DiscoveryDataLayer, ObjectCollection, ObjectCollectionView };
