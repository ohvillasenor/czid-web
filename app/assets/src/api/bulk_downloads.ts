import { WORKFLOW_ENTITIES } from "~utils/workflows";
import { get, postWithCSRF } from "./core";

export const getBulkDownloadTypes = (workflow: $TSFixMe) =>
  get(`/bulk_downloads/types?workflow=${workflow}`);

export const getBulkDownloadMetrics = (workflow: $TSFixMe) =>
  get(`/bulk_downloads/metrics?workflow=${workflow}`);

export const createBulkDownload = (bulkDownload: $TSFixMe) =>
  postWithCSRF("/bulk_downloads", {
    download_type: bulkDownload.downloadType,
    ...(bulkDownload.workflowEntity === WORKFLOW_ENTITIES.SAMPLES
      ? { sample_ids: bulkDownload.validObjectIds }
      : { workflow_run_ids: bulkDownload.validObjectIds }),
    workflow: bulkDownload.workflow,
    params: {
      sample_ids: { value: bulkDownload.validObjectIds },
      workflow: { value: bulkDownload.workflow },
      ...bulkDownload.fields,
    },
  });

export const getBulkDownloads = ({
  searchBy,
  n,
}: {
  searchBy?: string | null;
  n: string | null;
}) => get("/bulk_downloads.json", { params: { searchBy, n } });

export const getBulkDownload = (bulkDownloadId: number) =>
  get(`/bulk_downloads/${bulkDownloadId}.json`);

export const getPresignedOutputUrl = (bulkDownloadId: number) =>
  get(`/bulk_downloads/${bulkDownloadId}/presigned_output_url`);
