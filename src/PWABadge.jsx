import { useRegisterSW } from 'virtual:pwa-register/react'

function PWABadge() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log(`Service Worker at: ${swUrl}`)
      
      // Periodic sync every 1 hour
      const period = 60 * 60 * 1000
      if (period <= 0) return
      
      if (r?.active?.state === 'activated') {
        registerPeriodicSync(period, swUrl, r)
      } else if (r?.installing) {
        r.installing.addEventListener('statechange', (e) => {
          const sw = e.target
          if (sw.state === 'activated') {
            registerPeriodicSync(period, swUrl, r)
          }
        })
      }
    },
  })

  function close() {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50" role="alert" aria-labelledby="toast-message">
      {(offlineReady || needRefresh) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[320px] max-w-md fade-in">
          <div className="mb-3">
            {offlineReady ? (
              <span id="toast-message" className="text-sm text-gray-700 dark:text-gray-200">
                ✅ Learnful siap digunakan offline!
              </span>
            ) : (
              <span id="toast-message" className="text-sm text-gray-700 dark:text-gray-200">
                📦 Versi baru tersedia, klik reload untuk memperbarui.
              </span>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            {needRefresh && (
              <button
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={() => updateServiceWorker(true)}
              >
                Reload
              </button>
            )}
            <button
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              onClick={() => close()}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Periodic sync function
function registerPeriodicSync(period, swUrl, r) {
  if (period <= 0) return
  
  setInterval(async () => {
    if ('online' in navigator && !navigator.onLine) return
    
    try {
      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: {
          'cache': 'no-store',
          'cache-control': 'no-cache',
        },
      })
      
      if (resp?.status === 200) {
        await r.update()
        console.log('Service Worker updated periodically')
      }
    } catch (error) {
      console.log('Periodic sync failed:', error)
    }
  }, period)
}

export default PWABadge