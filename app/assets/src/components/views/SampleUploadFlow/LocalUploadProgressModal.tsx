import { ChecksumAlgorithm, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import cx from "classnames";
import {
  constant,
  filter,
  find,
  isEmpty,
  map,
  omit,
  size,
  sum,
  times,
  zipObject,
} from "lodash/fp";
import React, { useEffect, useState } from "react";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import {
  completeSampleUpload,
  getUploadCredentials,
  initiateBulkUploadLocalWithMetadata,
  startUploadHeartbeat,
} from "~/api/upload";
import { TaxonOption } from "~/components/common/filters/types";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { logError } from "~/components/utils/logUtil";
import { Project, SampleFromApi } from "~/interface/shared";
import Modal from "~ui/containers/Modal";
import ImgUploadPrimary from "~ui/illustrations/ImgUploadPrimary";
import Notification from "~ui/notifications/Notification";
import { RefSeqAccessionDataType } from "./components/UploadSampleStep/types";
import cs from "./upload_progress_modal.scss";
import {
  addAdditionalInputFilesToSamples,
  addFlagsToSamples,
  logUploadStepError,
  redirectToProject,
} from "./upload_progress_utils";
import UploadConfirmationModal from "./UploadConfirmationModal";
import UploadProgressModalSampleList from "./UploadProgressModalSampleList";

interface LocalUploadProgressModalProps {
  adminOptions: Record<string, string>;
  bedFile?: File;
  clearlabs?: boolean;
  guppyBasecallerSetting: string;
  medakaModel?: string;
  metadata?: Record<string, any>;
  onUploadComplete: $TSFixMeFunction;
  project?: Project;
  refSeqAccession: RefSeqAccessionDataType;
  refSeqFile?: File;
  refSeqTaxon?: TaxonOption;
  samples?: SampleFromApi[];
  skipSampleProcessing?: boolean;
  technology?: string;
  uploadType: string;
  useStepFunctionPipeline?: boolean;
  wetlabProtocol?: string;
  workflows?: Set<$TSFixMe>;
}

const LocalUploadProgressModal = ({
  adminOptions,
  bedFile,
  clearlabs,
  guppyBasecallerSetting,
  medakaModel,
  metadata,
  onUploadComplete,
  project,
  refSeqAccession,
  refSeqFile,
  refSeqTaxon,
  samples,
  skipSampleProcessing,
  technology,
  uploadType,
  useStepFunctionPipeline,
  wetlabProtocol,
  workflows,
}: LocalUploadProgressModalProps) => {
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  // State variables to manage download state
  const [retryingSampleUpload, setRetryingSampleUpload] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Store samples created in API
  const [locallyCreatedSamples, setLocallyCreatedSamples] = useState([]);

  // State to track download progress
  const [sampleFileUploadIds, setSampleFileUploadIds] = useState({});
  const [sampleUploadPercentages, setSampleUploadPercentages] = useState({});
  const [sampleUploadStatuses, setSampleUploadStatuses] = useState({});
  const [sampleFileCompleted, setSampleFileCompleted] = useState({});

  let sampleFilePercentages = {};

  const IN_PROGRESS_STATUS = "in progress";
  const ERROR_STATUS = "error";

  useEffect(() => {
    initiateLocalUpload();
  }, []);

  useEffect(() => {
    const uploadsInProgress = !isEmpty(getLocalSamplesInProgress());
    if (uploadComplete || uploadsInProgress) return;

    completeLocalUpload();
  }, [sampleUploadStatuses]);

  const initiateLocalUpload = async () => {
    const samplesToUpload = addFlagsToSamples({
      adminOptions,
      bedFileName: bedFile?.name,
      clearlabs,
      guppyBasecallerSetting,
      medakaModel,
      samples,
      useStepFunctionPipeline,
      refSeqAccession,
      refSeqFileName: refSeqFile?.name,
      refSeqTaxon,
      skipSampleProcessing,
      technology,
      workflows,
      wetlabProtocol,
    });

    addAdditionalInputFilesToSamples({
      samples: samplesToUpload,
      bedFile,
      refSeqFile,
    });

    // Create the samples in the db; this does NOT upload files to s3
    const createdSamples = await initiateBulkUploadLocalWithMetadata({
      samples: samplesToUpload,
      metadata,
      onCreateSamplesError: (
        errors: $TSFixMe,
        erroredSampleNames: $TSFixMe,
      ) => {
        logError({
          message: "UploadProgressModal: onCreateSamplesError",
          details: { errors },
        });

        const uploadStatuses = zipObject(
          erroredSampleNames,
          times(constant(ERROR_STATUS), erroredSampleNames.length),
        );

        setSampleUploadStatuses(prevState => ({
          ...prevState,
          ...uploadStatuses,
        }));

        logUploadStepError({
          step: "createSamples",
          erroredSamples: erroredSampleNames.length,
          uploadType,
          errors,
        });
      },
    });

    setLocallyCreatedSamples(createdSamples);
    // For each sample, upload sample.input_files to s3
    // Also handles the upload progress bar for each sample
    await uploadSamples(createdSamples);
  };

  const uploadSamples = async (samples: $TSFixMe) => {
    // Ping a heartbeat periodically to say the browser is actively uploading the samples.
    const heartbeatInterval = await startUploadHeartbeat(map("id", samples));

    await Promise.all(
      samples.map(async (sample: $TSFixMe) => {
        try {
          // Get the credentials for the sample
          const s3ClientForSample = await getS3Client(sample);
          // Set the upload percentage for the sample to 0
          updateSampleUploadPercentage(sample.name, 0);

          await Promise.all(
            sample.input_files.map(async (inputFile: $TSFixMe) => {
              // Upload the input file to s3
              // Also updates the upload percentage for the sample
              await uploadInputFileToS3(sample, inputFile, s3ClientForSample);
            }),
          );

          // Update the sample upload status (success or error)
          await completeSampleUpload({
            sample,
            onSampleUploadSuccess: (sample: $TSFixMe) => {
              updateSampleUploadStatus(sample.name, "success");
            },
            onMarkSampleUploadedError: handleSampleUploadError,
          });
        } catch (e) {
          handleSampleUploadError(sample, e);
          clearInterval(heartbeatInterval);
        }
      }),
    );

    clearInterval(heartbeatInterval);
    trackEvent(
      ANALYTICS_EVENT_NAMES.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOADS_BATCH_HEARTBEAT_COMPLETED,
      {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        sampleIds: map("id", samples),
      },
    );
  };

  const getS3Client = async (sample: $TSFixMe) => {
    const credentials = await getUploadCredentials(sample.id);
    const {
      access_key_id: accessKeyId,
      aws_region: region,
      expiration,
      secret_access_key: secretAccessKey,
      session_token: sessionToken,
    } = credentials;

    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken,
        expiration,
      },
      useAccelerateEndpoint: true,
    });
  };

  const uploadInputFileToS3 = async (
    sample: $TSFixMe,
    inputFile: $TSFixMe,
    s3Client: $TSFixMe,
  ) => {
    const {
      name: fileName,
      s3_bucket: s3Bucket,
      s3_file_path: s3Key,
    } = inputFile;

    if (sampleFileCompleted[s3Key]) {
      return;
    }

    const body = sample.filesToUpload[fileName];
    const uploadParams = {
      Bucket: s3Bucket,
      Key: s3Key,
      Body: body,
      ChecksumAlgorithm: ChecksumAlgorithm.SHA256,
    };

    updateSampleFilePercentage({
      sampleName: sample.name,
      s3Key,
      fileSize: body.size,
    });

    const fileUpload = new Upload({
      client: s3Client,
      leavePartsOnError: true, // configures lib to propagate errors
      params: uploadParams,
      ...(sampleFileUploadIds[s3Key] && {
        uploadId: sampleFileUploadIds[s3Key],
      }),
    });

    const removeS3KeyFromUploadIds = (s3Key: $TSFixMe) => {
      setSampleFileUploadIds(prevState => omit(s3Key, prevState));
    };

    fileUpload.on("httpUploadProgress", progress => {
      const percentage = progress.loaded / progress.total;
      updateSampleFilePercentage({
        sampleName: sample.name,
        s3Key,
        percentage,
      });
    });

    fileUpload.onCreatedMultipartUpload(uploadId => {
      setSampleFileUploadIds(prevState => {
        return uploadId
          ? { ...prevState, [s3Key]: uploadId }
          : // when there is no valid upload ID we could not create a multipart upload
            // for the file, so remove it from upload ID list to avoid retrying it
            removeS3KeyFromUploadIds(s3Key);
      });
    });

    await fileUpload.done();

    // prevent successfully uploaded files from being resumed if other files fail
    removeS3KeyFromUploadIds(s3Key);

    setSampleFileCompleted(prevState => ({
      ...prevState,
      [s3Key]: true,
    }));
  };

  const updateSampleUploadStatus = (sampleName: $TSFixMe, status: $TSFixMe) => {
    setSampleUploadStatuses(prevState => ({
      ...prevState,
      [sampleName]: status,
    }));
  };

  const updateSampleFilePercentage = ({
    sampleName,
    s3Key,
    percentage = 0,
    fileSize = null,
  }: $TSFixMe) => {
    const newSampleKeyState = { percentage };
    if (fileSize) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type '{ percenta... Remove this comment to see the full error message
      newSampleKeyState.size = fileSize;
    }

    const newSampleFileState = {
      ...sampleFilePercentages[sampleName],
      [s3Key]: {
        ...(sampleFilePercentages[sampleName] &&
          sampleFilePercentages[sampleName][s3Key]),
        ...newSampleKeyState,
      },
    };

    sampleFilePercentages = {
      ...sampleFilePercentages,
      [sampleName]: newSampleFileState,
    };

    updateSampleUploadPercentage(
      sampleName,
      calculatePercentageForSample(sampleFilePercentages[sampleName]),
    );
  };

  const updateSampleUploadPercentage = (
    sampleName: $TSFixMe,
    percentage: $TSFixMe,
  ) => {
    setSampleUploadPercentages(prevState => ({
      ...prevState,
      [sampleName]: percentage,
    }));
  };

  const calculatePercentageForSample = (sampleFilePercentage: $TSFixMe) => {
    const uploadedSize = sum(
      map(key => (key.percentage || 0) * key.size, sampleFilePercentage),
    );

    const totalSize = sum(map(progress => progress.size, sampleFilePercentage));

    return uploadedSize / totalSize;
  };

  const handleSampleUploadError = (sample: $TSFixMe, error = null) => {
    const message =
      "UploadProgressModal: Local sample upload error to S3 occured";

    updateSampleUploadStatus(sample.name, ERROR_STATUS);

    logError({
      message,
      details: {
        sample,
        error,
      },
    });

    logUploadStepError({
      step: "sampleUpload",
      erroredSamples: 1,
      uploadType,
      errors: error,
    });
  };

  const getLocalSamplesInProgress = () => {
    return filter(
      sample =>
        sampleUploadStatuses[sample.name] === undefined ||
        sampleUploadStatuses[sample.name] === IN_PROGRESS_STATUS,
      samples,
    );
  };

  const getLocalSamplesFailed = () => {
    return filter(
      sample => sampleUploadStatuses[sample.name] === ERROR_STATUS,
      samples,
    );
  };

  const retryFailedSampleUploads = async (failedSamples: $TSFixMe) => {
    setRetryingSampleUpload(true);
    setUploadComplete(false);

    const failedLocallyCreatedSamples = map(failedSample => {
      updateSampleUploadStatus(failedSample.name, IN_PROGRESS_STATUS);

      return find({ name: failedSample.name }, locallyCreatedSamples);
    }, failedSamples);

    await uploadSamples(failedLocallyCreatedSamples);
  };

  const completeLocalUpload = () => {
    onUploadComplete();
    setUploadComplete(true);
    setRetryingSampleUpload(false);

    // TODO(nina): These analytics events are creating unique table names
    // for each occurrence and clogging up our analytics pipeline. Commenting
    // out until we can figure out why and fix the root issue.

    /* const numFailedSamples = size(getLocalSamplesFailed());

    if (numFailedSamples > 0) {
      const failedSamples = filter(
        sample => sampleUploadStatuses[sample.name] === "error",
        samples,
      );
      const createdSamples = filter(
        sample => sampleUploadStatuses[sample.name] !== "error",
        samples,
      );

      const getIdForSample = sample => {
        const localSample = find({ name: sample.name }, locallyCreatedSamples);
        return localSample?.id;
      };

      const createdSampleIds = compact(map(getIdForSample, createdSamples));

      const erroredSampleIds = compact(map(getIdForSample, failedSamples));

      trackEvent(
        ANALYTICS_EVENT_NAMES.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOAD_FAILED,
        {
          createdSampleIds,
          createdSamples: samples.length - failedSamples.length,
          createdSamplesFileSizes: sampleNameToFileSizes(createdSamples),
          erroredSampleIds,
          erroredSamples: failedSamples.length,
          erroredSamplesFileSizes: sampleNameToFileSizes(failedSamples),
          projectId: project.id,
          uploadType,
        },
      );
    } else {
      trackEvent(
        ANALYTICS_EVENT_NAMES.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOAD_SUCCEEDED,
        {
          createdSamples: samples.length,
          createdSampleIds: pluck("id", locallyCreatedSamples),
          createdSamplesFileSizes: sampleNameToFileSizes(samples),
          projectId: project.id,
          uploadType,
        },
      );
    } */
  };

  // Returns a map of sample names to a list of their file sizes
  /*   const sampleNameToFileSizes = (samples: $TSFixMe) => {
    return samples.reduce(function(
      nameToFileSizes: $TSFixMe,
      sample: $TSFixMe,
    ) {
      nameToFileSizes[sample.name] = map(file => file.size, sample.files);
      return nameToFileSizes;
    },
    {});
  }; */

  /*
    START Component rendering methods
  */

  const uploadInProgressTitle = () => {
    const numLocalSamplesInProgress = size(getLocalSamplesInProgress());
    const pluralSuffix = numLocalSamplesInProgress > 1 ? "s" : "";

    return (
      <>
        <div className={cs.title}>
          {retryingSampleUpload
            ? `Retrying ${numLocalSamplesInProgress} sample upload${pluralSuffix}`
            : `Uploading ${numLocalSamplesInProgress} sample${pluralSuffix} to ${project.name}`}
        </div>
        <div className={cs.subtitle}>
          Please stay on this page until upload completes! Closing your device
          or putting it to sleep will interrupt the upload.
        </div>
      </>
    );
  };

  const failedSamplesTitle = () => {
    const numFailedSamples = size(getLocalSamplesFailed());
    const title =
      Object.keys(sampleUploadStatuses).length === numFailedSamples
        ? "All uploads failed"
        : `Uploads completed with ${numFailedSamples} error${
            numFailedSamples > 1 ? "s" : ""
          }`;

    return (
      <>
        <div className={cs.titleWithIcon}>{title}</div>
        {numFailedSamples === size(samples) && (
          <div className={cs.subtitle}>
            <a
              className={cs.helpLink}
              href="mailto:help@czid.org"
              onClick={() =>
                trackEvent(
                  ANALYTICS_EVENT_NAMES.LOCAL_UPLOAD_PROGRESS_MODAL_CONTACT_US_LINK_CLICKED,
                )
              }
            >
              Contact us for help
            </a>
          </div>
        )}
      </>
    );
  };

  const renderTitle = () => {
    const numLocalSamplesInProgress = size(getLocalSamplesInProgress());
    // While local samples are being uploaded.
    if (numLocalSamplesInProgress) {
      return uploadInProgressTitle();
    } else if (!isEmpty(getLocalSamplesFailed())) {
      return failedSamplesTitle();
    } else {
      return <div className={cs.titleWithIcon}>Uploads completed!</div>;
    }
  };

  const renderRetryAllFailedNotification = () => {
    const localSamplesFailed = getLocalSamplesFailed();
    const numberOfLocalSamplesFailed = size(localSamplesFailed);

    return (
      <Notification
        className={cs.notificationContainer}
        type="error"
        displayStyle="flat"
      >
        <div className={cs.content}>
          <div className={cs.errorMessage}>
            {numberOfLocalSamplesFailed} upload
            {numberOfLocalSamplesFailed > 1 && "s"} ha
            {numberOfLocalSamplesFailed > 1 ? "ve" : "s"} failed
          </div>
          <div
            className={cx(cs.sampleRetry, cs.retryAll)}
            onClick={withAnalytics(
              () => retryFailedSampleUploads(localSamplesFailed),
              ANALYTICS_EVENT_NAMES.LOCAL_UPLOAD_PROGRESS_MODAL_RETRY_ALL_FAILED_CLICKED,
              {
                numberOfLocalSamplesFailed,
              },
            )}
          >
            Retry all failed
          </div>
        </div>
      </Notification>
    );
  };

  const renderViewProjectButton = () => {
    const buttonCallback = () => {
      trackEvent(
        ANALYTICS_EVENT_NAMES.LOCAL_UPLOAD_PROGRESS_MODAL_GO_TO_PROJECT_BUTTON_CLICKED,
        {
          projectId: project.id,
          projectName: project.name,
        },
      );
      if (!isEmpty(getLocalSamplesFailed())) {
        setConfirmationModalOpen(true);
      } else {
        redirectToProject(project.id);
      }
    };

    return (
      <PrimaryButton text="Go to Project" onClick={() => buttonCallback()} />
    );
  };
  /*
    END component rendering methods
  */

  return (
    <Modal
      open
      tall
      narrow
      className={cx(
        cs.uploadProgressModal,
        uploadComplete && cs.uploadComplete,
      )}
    >
      <div className={cs.header}>
        <ImgUploadPrimary className={cs.uploadImg} />
        {renderTitle()}
        {!isEmpty(getLocalSamplesFailed()) &&
          renderRetryAllFailedNotification()}
      </div>
      <UploadProgressModalSampleList
        samples={samples}
        sampleUploadPercentages={sampleUploadPercentages}
        sampleUploadStatuses={sampleUploadStatuses}
        onRetryUpload={retryFailedSampleUploads}
      />
      {!retryingSampleUpload && uploadComplete && (
        <div className={cs.footer}>{renderViewProjectButton()}</div>
      )}
      {confirmationModalOpen && (
        <UploadConfirmationModal
          numberOfFailedSamples={size(getLocalSamplesFailed())}
          onCancel={() => {
            trackEvent(
              ANALYTICS_EVENT_NAMES.UPLOAD_CONFIRMATION_MODAL_RETURN_TO_UPLOAD_BUTTON_CLICKED,
              {
                numberOfTotalSamples: size(samples),
                numberOfFailedSamples: size(getLocalSamplesFailed),
              },
            );
            setConfirmationModalOpen(false);
          }}
          onConfirm={() => {
            trackEvent(
              ANALYTICS_EVENT_NAMES.UPLOAD_CONFIRMATION_MODAL_LEAVE_UPLOAD_BUTTON_CLICKED,
              {
                numberOfTotalSamples: size(samples),
                numberOfFailedSamples: size(getLocalSamplesFailed),
              },
            );

            redirectToProject(project.id);
          }}
          open
        />
      )}
    </Modal>
  );
};

export default LocalUploadProgressModal;
