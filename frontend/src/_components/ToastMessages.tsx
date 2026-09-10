'use client'

import { useEffect, useMemo, useState } from 'react'
import { Transition } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'

import { useDeleteCookie, useGetCookie } from 'cookies-next';
import clsx from 'clsx'


const ToastMessages = () => {

  const getCookie = useGetCookie();
  const deleteCookie = useDeleteCookie();
  const toast = getCookie('toast')?.toString();
  const [dismissedToast, setDismissedToast] = useState<string>();
  const notification = useMemo(() => {
    if (!toast) return undefined;

    try {
      const parsed = JSON.parse(toast) as { isError?: boolean; message?: string };
      return {
        isError: Boolean(parsed.isError),
        message: parsed.message ?? '',
      };
    } catch {
      return { isError: true, message: 'An unexpected error occurred.' };
    }
  }, [toast]);
  const show = Boolean(notification && toast !== dismissedToast);
  const isError = notification?.isError ?? false;
  const message = notification?.message ?? '';


  useEffect(() => {
 
    if (!toast || isError || !show) return;

    const timeout = window.setTimeout(() => {
      deleteCookie('toast');
      setDismissedToast(toast);
    }, 10 * 1000);

    return () => window.clearTimeout(timeout);
  }, [toast, isError, show, deleteCookie]);
 
  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-400"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
          <Transition show={show}>
            <div className={clsx(isError ? "bg-red-50" : "bg-green-50", "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg  ring-1 shadow-lg ring-black/5 transition data-closed:opacity-0 data-enter:transform data-enter:duration-300 data-enter:ease-out data-closed:data-enter:translate-y-2 data-leave:duration-100 data-leave:ease-in data-closed:data-enter:sm:translate-x-2 data-closed:data-enter:sm:translate-y-0")}>
              <div className="p-4">
                <div className="flex items-start">
                  <div className="shrink-0">
                    {isError ?
                      <XCircleIcon aria-hidden="true" className="size-6 text-red-400"></XCircleIcon> :
                      <CheckCircleIcon aria-hidden="true" className="size-6 text-green-400" />}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className={clsx(isError ? "text-red-900" : "text-green-900", "text-sm font-medium")}>{message}</p>
                  </div>
                  <div className="ml-4 flex shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        deleteCookie('toast')
                        setDismissedToast(toast);
                      }}
                      className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-hidden"
                    >
                      <span className="sr-only">Fermer</span>
                      <XMarkIcon aria-hidden="true" className={clsx(isError ? "bg-red-50" : "bg-green-50", "size-5")} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  )
}

export default ToastMessages;
