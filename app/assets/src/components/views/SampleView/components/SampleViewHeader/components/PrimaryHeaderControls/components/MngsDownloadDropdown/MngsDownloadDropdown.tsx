import querystring from "querystring";
import { isNull } from "lodash/fp";
import React from "react";
import SvgSaver from "svgsaver";
import DownloadButtonDropdown from "~/components/ui/controls/dropdowns/DownloadButtonDropdown";
import { triggerFileDownload } from "~/components/utils/clientDownload";
import { logError } from "~/components/utils/logUtil";
import { showToast } from "~/components/utils/toast";
import { WORKFLOWS } from "~/components/utils/workflows";
import {
  getDownloadDropdownOptions,
  getLinkInfoForDownloadOption,
  logDownloadOption,
} from "~/components/views/report/utils/download";
import { TABS } from "~/components/views/SampleView/utils";
import Sample from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import Notification from "~ui/notifications/Notification";

interface MngsDownloadDropdownProps {
  backgroundId?: number;
  className?: string;
  currentTab?: string;
  getDownloadReportTableWithAppliedFiltersLink?: $TSFixMeFunction;
  hasAppliedFilters?: boolean;
  pipelineRun?: PipelineRun;
  sample?: Sample;
  view?: string;
}

const MngsDownloadDropdown = ({
  backgroundId,
  className,
  currentTab,
  getDownloadReportTableWithAppliedFiltersLink,
  hasAppliedFilters,
  pipelineRun,
  sample,
  view,
}: MngsDownloadDropdownProps) => {
  const downloadCSV = () => {
    const resParams = {
      ...(backgroundId && { background_id: backgroundId }),
      ...(pipelineRun &&
        pipelineRun.pipeline_version && {
          pipeline_version: pipelineRun.pipeline_version,
        }),
    };
    location.href = `/samples/${sample.id}/report_csv?${querystring.stringify(
      resParams,
    )}`;
  };

  const handleDownload = (option: $TSFixMe) => {
    switch (option) {
      case "download_csv":
        isNull(backgroundId) &&
          sample.initial_workflow !== WORKFLOWS.LONG_READ_MNGS.value &&
          renderNoBackgroundSelectedNotification();
        downloadCSV();
        break;
      case "download_csv_with_filters":
        isNull(backgroundId) &&
          sample.initial_workflow !== WORKFLOWS.LONG_READ_MNGS.value &&
          renderNoBackgroundSelectedNotification();
        triggerFileDownload({
          downloadUrl: getDownloadReportTableWithAppliedFiltersLink(),
          fileName: `${sample.name}_report_with_applied_filters.csv`,
        });
        break;
      case "taxon_svg":
        new SvgSaver().asSvg(getTaxonTreeNode(), "taxon_tree.svg");
        break;
      case "taxon_png":
        new SvgSaver().asPng(getTaxonTreeNode(), "taxon_tree.png");
        break;
      default: {
        const linkInfo = getLinkInfoForDownloadOption(
          option,
          sample.id,
          pipelineRun,
        );

        if (linkInfo) {
          window.open(linkInfo.path, linkInfo.newPage ? "_blank" : "_self");
        } else {
          logError({
            message:
              "SampleViewControls/DownloadDropdown: Invalid option passed to handleDownload",
            details: { option },
          });
        }
        break;
      }
    }

    logDownloadOption({
      component: "SampleViewControls/DownloadDropdown",
      option,
      details: {
        sampleId: sample.id,
        sampleName: sample.name,
      },
    });
  };

  const renderNoBackgroundSelectedNotification = () =>
    showToast(
      ({ closeToast }: $TSFixMe) => (
        <Notification
          type="info"
          displayStyle="elevated"
          onClose={closeToast}
          closeWithIcon
        >
          The downloaded report will not contain the aggregate and z-score
          columns because a background model was not selected.
        </Notification>
      ),
      { autoClose: 12000 },
    );

  // TODO (gdingle): should we pass in a reference with React somehow?
  const getTaxonTreeNode = () => {
    return document.getElementsByClassName("taxon-tree-vis")[0];
  };

  const getImageDownloadOptions = () => {
    if (view === "tree") {
      return [
        { text: "Download Taxon Tree as SVG", value: "taxon_svg" },
        { text: "Download Taxon Tree as PNG", value: "taxon_png" },
      ];
    }
    return [];
  };

  const downloadOptions = [
    {
      text: "Download Report Table (.csv)",
      value: "download_csv",
      disabled: currentTab === TABS.MERGED_NT_NR,
    },
    {
      text: "Download Report Table with Applied Filters (.csv)",
      value: "download_csv_with_filters",
      disabled: !hasAppliedFilters,
    },
    ...getDownloadDropdownOptions(pipelineRun),
    ...getImageDownloadOptions(),
  ];

  return (
    <DownloadButtonDropdown
      className={className}
      options={downloadOptions}
      onClick={handleDownload}
      direction="left"
    />
  );
};

export default MngsDownloadDropdown;
