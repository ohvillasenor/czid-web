import { Link, Notification } from "czifui";
import React from "react";
import { pluralize } from "~/components/utils/stringUtil";
import { WORKFLOW_LABELS } from "~/components/utils/workflows";

interface DeleteSuccessNotificationProps {
  onClose(): void;
  sampleCount: number;
  workflowLabel: WORKFLOW_LABELS;
}

const DeleteErrorNotification = ({
  onClose,
  sampleCount,
  workflowLabel,
}: DeleteSuccessNotificationProps) => (
  <Notification
    intent="error"
    onClose={onClose}
    buttonText="dismiss"
    buttonOnClick={onClose}
    dismissDirection="right"
  >
    {sampleCount} {workflowLabel} {pluralize("run", sampleCount)} failed to
    delete. Please try again. If the problem persists, please contact us at{" "}
    <Link sdsStyle="dashed" href="mailto:help@czid.org">
      help@czid.org
    </Link>
    .
  </Notification>
);

export { DeleteErrorNotification };