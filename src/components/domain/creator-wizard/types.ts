export interface StepProps {
  /** Called after the step has saved. */
  onNext: () => void;
  /** "Continue" while walking through the wizard; "Save" when one step is opened to edit it. */
  submitLabel?: string;
}
