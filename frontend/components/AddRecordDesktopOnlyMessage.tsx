/**
 * Shown on small viewports (below md) to explain that adding records is only available on desktop/tablet.
 * Use on list pages instead of "Add" buttons and on create pages instead of the form.
 */
export default function AddRecordDesktopOnlyMessage() {
  return (
    <p className="text-sm text-gray-600">
      To add a new record, please use the full website on a computer or tablet.
    </p>
  );
}
