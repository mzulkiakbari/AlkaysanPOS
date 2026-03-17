

export const AlertModal = ({
  text = {
    header: '',
    note: '',
    confirmButton: 'Yes',
    cancelButton: 'Cancel'
  },
  type = 'alert',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-4 items-center justify-center text-center">
      <span className="font-semibold text-black dark:text-white">{ text.header }</span>
      <div className="flex flex-row gap-2 justify-between w-full">
        { type !== "success" &&
          <button type="button" onClick={ props.onConfirm && props.onConfirm } className={`rounded-full w-full px-4 py-1 ${type === 'warning' && 'bg-warning hover:bg-warning/70'} ${ type === 'alert' && 'bg-warning hover:bg-warning/70' } ${ type ==='danger' && 'bg-primary hover:bg-primary/90' } dark:bg-meta-4 text-white dark:text-black font-semibold`}>{ text.confirmButton }</button>
        }

        <button type="button" onClick={ props.onClose && props.onClose } className="rounded-full w-full px-4 py-1 bg-white border-graydark border-solid border-2 dark:border-white dark:bg-graydark text-black dark:text-white hover:text-white dark:hover:text-black font-semibold hover:bg-meta-4 dark:hover:border-white">{ text.cancelButton }</button>
      </div>

      { text.note && text.note !== '' &&
        <span className="font-semibold text-black dark:text-white text-sm">{ text.note }</span>
      }
    </div>
  )
}