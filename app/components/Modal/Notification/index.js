"use client";

import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

export default function NotificationAlert({
  text,
  status = 'default',
  ...props
}) {
  const [alertTimeout, setAlertTimeout] = useState(false);

  useEffect(() => {
    const notificationTimeout = setTimeout(() => {
      setAlertTimeout(true);
      clearTimeout(notificationTimeout);
    }, 3000);
  });

  const SetBackgroundColor = (value) => {
    switch (value) {
      case 'success':
        return 'bg-white';
        break;

      case 'default':
        return 'bg-white';
        break;

      case 'error':
        return 'bg-danger';
        break;

      case 'danger':
        return 'bg-danger';
        break;

      case 'alert':
        return 'bg-warning';
        break;

      case 'warning':
        return 'bg-warning';
        break;

      default:
        return 'bg-white';
        break;
    }
  }

  const SetTextColor = (value) => {
    switch (value) {
      case 'success':
        return 'text-black';
        break;

      case 'default':
        return 'text-black';
        break;

      case 'error':
        return 'text-white';
        break;

      case 'danger':
        return 'text-white';
        break;

      case 'warning':
        return 'text-white';
        break;

      case 'alert':
        return 'text-white';
        break;

      default:
        return 'text-black';
        break;
    }
  }

  const notificationComponent = (
    <div className="fixed top-0 left-0 w-full z-9999">
      <div className={`relative w-[30%] mx-auto top-2.5 ${SetBackgroundColor(status)} dark:bg-graydark px-10 py-2 shadow-xl ring-1 ring-tw-gray-900/5 rounded-full flex items-center justify-center slideDownUp ${alertTimeout && 'delayed'}`}>
        <span className={`font-semibold ${SetTextColor(status)} dark:text-white`}>{text}</span>
        <button
          type="button"
          className="absolute right-2 hover:text-slate-400 dark:text-white"
          onClick={props.onClose && props.onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-6 h-6 ${SetTextColor(status)}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    notificationComponent,
    document.body
  );
}