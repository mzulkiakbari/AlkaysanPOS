import React, { useEffect, useRef, useState, createContext, useContext } from "react";
import ReactDOM from "react-dom";

const ModalBack = () => {
  if (typeof window !== 'undefined' && window.history.state && window.history.state.title && window.history.state.title !== 'undefined') {
    document.title = window.history.state.title;
    try {
      window.history.replaceState({
        ...window.history.state,
        title: document.title,
        uri: window.location.href
      }, '', window.history.state.uri || window.location.href);
    } catch (e) { }
  }
}

const Modal = ({
  onClose,
  children,
  title,
  mode = 'modal',
  show = true,
  ...props
}) => {
  const modal = useRef(null);
  const [isShow, setIsShow] = useState(show);
  const [originalTitle, setOriginalTitle] = useState('');

  useEffect(() => {
    setIsShow(show);
    if (show && typeof document !== 'undefined') {
      // Capture the REAL title if it's not already broken
      if (document.title && document.title !== 'undefined') {
        setOriginalTitle(document.title);
      }
    }
  }, [show]);

  // Restore title on unmount or when hidden
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && originalTitle && (document.title === 'undefined' || !document.title)) {
        document.title = originalTitle;
      }
    };
  }, [originalTitle]);

  function onDismiss() {
    onClose && onClose();
    setIsShow(false);

    // Restore title immediately on dismiss
    if (typeof document !== 'undefined' && originalTitle) {
      document.title = originalTitle;
    }

    ModalBack();
  }

  if (props.parallel) {
    window.history.replaceState({
      title: document.title,
      uri: window.location.href
    }, '', props.parallel);
  }

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (keyCode !== 27) return;
      onDismiss();
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  const modalContent = (
    <div
      className="fixed inset-0 w-full h-full flex justify-center items-center bg-black/60 z-[9998] backdrop-blur-sm"
      onClick={onDismiss}
    >
      {mode === 'modal' &&
        <div
          ref={modal}
          onClick={(e) => e.stopPropagation()}
          className="w-full md:w-2/3 lg:w-1/2 2xl:w-1/3 max-h-[90vh] flex flex-col mx-4"
        >
          <div className="bg-white dark:bg-graydark relative flex flex-col h-full w-full rounded-3xl overflow-hidden shadow-2xl">
            {title && (
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h1 className="font-black text-lg uppercase dark:text-white tracking-tight">{title}</h1>
                <button onClick={onDismiss} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">{children}</div>
          </div>
        </div>
      }

      {mode === 'popup' &&
        <div
          ref={modal}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white dark:bg-graydark px-10 py-6 shadow-2xl ring-1 ring-black/5 sm:mx-auto sm:max-w-lg sm:rounded-3xl"
        >
          {children}
        </div>
      }
    </div>
  );

  return isShow && ReactDOM.createPortal(
    modalContent,
    document.body
  );
};

export const ModalFooter = ({
  withCloseButton,
  children
}) => {
  const CloseButton = () => {
    ModalBack();
    withCloseButton?.function && withCloseButton.function();
  }

  return (
    <div className="flex flex-row absolute bottom-0 right-0 justify-end items-center gap-2 px-4 py-3">
      {children && children}

      {withCloseButton && !withCloseButton.element &&
        <button
          title="cancel"
          className='rounded-md px-4 py-2 bg-slate-100 hover:bg-slate-300 text-black'
          onClick={(e) => {
            e.stopPropagation();
            CloseButton();
          }}
        >Tutup</button>
      }
    </div>
  )
}

const ModalContext = createContext(false);

export const useModalContext = () => useContext(ModalContext);

export const ModalProvider = ({ children, ...props }) => {
  return (
    <ModalContext.Provider value={true}>
      <Modal {...props} show>
        {children}
      </Modal>
    </ModalContext.Provider>
  )
};

export default Modal;