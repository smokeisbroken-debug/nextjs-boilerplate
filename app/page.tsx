'use client';

import { useState, useEffect } from 'react';

export default function BrokeApp() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'add' | 'chart' | 'whatif' | 'settings'>('home');
  const [walletHP] = useState(77);
  const [realBalance] = useState(830);

  // Telegram WebApp
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#000000');
      tg.ready();
    }
  }, []);

  const showScreen = (screen: typeof currentScreen) => {
    setCurrentScreen(screen);
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  return (
    <div className="bg-black text-white min-h-screen pb-20 font-sans">
      {/* HEADER */}
      <div className="bg-black border-b border-[#22ff88]/30 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#22ff88] rounded-2xl flex items-center justify-center text-3xl">🐸</div>
          <div className="flex items-baseline">
            <span className="text-3xl font-black tracking-tighter text-[#22ff88] neon">$BROKE</span>
            <span className="text-3xl font-black tracking-tighter">Life Tracker</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#22ff88]">
          <span className="font-mono text-xl font-bold">{walletHP}/100</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-4">
        {/* HOME */}
        {currentScreen === 'home' && (
          <div>
            <div className="mb-6">
              <p className="text-[#22ff88] text-sm font-medium">Твой кошелёк не сломан.</p>
              <p className="text-3xl font-bold text-red-400">Он течёт.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Income */}
              <div className="bg-zinc-900 rounded-3xl p-5">
                <div className="flex justify-between">
                  <span className="text-emerald-400">Income</span>
                  <span className="font-mono text-2xl">$3,850</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">This month</p>
              </div>

              {/* Life Cost */}
              <div className="bg-zinc-900 rounded-3xl p-5">
                <div className="flex justify-between">
                  <span className="text-red-400">Life Cost</span>
                  <span className="font-mono text-2xl">$2,410</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">This month</p>
              </div>

              {/* Money Leaks */}
              <div className="bg-zinc-900 rounded-3xl p-5 border border-red-500/40">
                <div className="flex justify-between">
                  <span className="text-orange-400">Money Leaks</span>
                  <span className="font-mono text-2xl">$610</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">This month</p>
              </div>

              {/* Wallet HP */}
              <div className="bg-zinc-900 rounded-3xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400">Wallet HP</p>
                    <div className="h-2.5 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                      <div className="h-2.5 bg-gradient-to-r from-[#22ff88] to-emerald-400 w-[77%] rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-5xl font-bold text-[#22ff88]">{walletHP}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-4">
              <p className="text-red-400 text-sm mb-2">Today&apos;s Damage <span className="font-mono">- $68</span></p>
              <div className="h-64 bg-black rounded-2xl flex items-center justify-center text-8xl opacity-10">📉</div>
            </div>
          </div>
        )}

        {/* ADD EXPENSE */}
        {currentScreen === 'add' && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center bg-zinc-900 rounded-3xl px-8 py-4 text-6xl font-mono">
                $<input type="text" defaultValue="25.00" className="bg-transparent w-28 text-center outline-none text-[#22ff88]" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {['☕ Coffee', '🚬 Smoking', '🍔 Takeouts', '🛍️ Shopping', '📺 Subscriptions', '🚕 Taxi'].map((item) => (
                <button
                  key={item}
                  onClick={() => alert(`Выбрана категория: ${item}`)}
                  className="bg-zinc-900 hover:bg-[#22ff88]/10 rounded-3xl p-4 flex flex-col items-center gap-2 transition-all"
                >
                  <span className="text-4xl">{item.split(' ')[0]}</span>
                  <span className="text-sm">{item.split(' ')[1]}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mb-8">
              <button className="flex-1 py-4 bg-emerald-500/20 text-emerald-400 rounded-3xl font-medium">Needed</button>
              <button className="flex-1 py-4 bg-red-500/20 text-red-400 rounded-3xl font-medium">Not needed</button>
              <button className="flex-1 py-4 bg-amber-500/20 text-amber-400 rounded-3xl font-medium">Maybe</button>
            </div>

            <button
              onClick={() => {
                alert('✅ Трата добавлена!');
                showScreen('home');
              }}
              className="w-full bg-[#22ff88] hover:bg-[#22ff88]/90 text-black font-bold py-6 rounded-3xl text-xl flex items-center justify-center gap-2"
            >
              + ADD EXPENSE
            </button>
          </div>
        )}

        {/* CHART, WHAT IF?, SETTINGS — можно дальше расширять */}
        {currentScreen === 'chart' && <div className="h-96 flex items-center justify-center text-6xl text-[#22ff88]/20">📊 $BROKE CHART (Chart.js скоро)</div>}
        {currentScreen === 'whatif' && (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold mb-6">Small changes.<br />Big wins.</h2>
            {/* Здесь будут карточки What If? — могу добавить сразу, если хочешь */}
            <div className="bg-gradient-to-r from-[#22ff88] to-emerald-400 text-black rounded-3xl p-8 text-center">
              <p className="font-medium">Total Potential Savings</p>
              <p className="text-6xl font-black">$3,344/year</p>
              <p className="text-2xl">+18 Wallet HP</p>
            </div>
          </div>
        )}
        {currentScreen === 'settings' && <div className="text-center text-2xl text-gray-400 py-20">Settings coming soon...</div>}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#22ff88]/30 py-3 px-2">
        <div className="flex justify-around items-center text-xs">
          <button onClick={() => showScreen('home')} className={`flex flex-col items-center ${currentScreen === 'home' ? 'text-[#22ff88]' : 'text-gray-400'}`}>
            <span className="text-2xl">🏠</span>
            <span>Home</span>
          </button>
          <button onClick={() => showScreen('add')} className="flex flex-col items-center -mt-8">
            <div className="bg-[#22ff88] text-black w-14 h-14 rounded-3xl flex items-center justify-center text-4xl shadow-xl">＋</div>
          </button>
          <button onClick={() => showScreen('chart')} className={`flex flex-col items-center ${currentScreen === 'chart' ? 'text-[#22ff88]' : 'text-gray-400'}`}>
            <span className="text-2xl">📈</span>
            <span>Chart</span>
          </button>
          <button onClick={() => showScreen('whatif')} className={`flex flex-col items-center ${currentScreen === 'whatif' ? 'text-[#22ff88]' : 'text-gray-400'}`}>
            <span className="text-2xl">💡</span>
            <span>What If?</span>
          </button>
          <button onClick={() => showScreen('settings')} className={`flex flex-col items-center ${currentScreen === 'settings' ? 'text-[#22ff88]' : 'text-gray-400'}`}>
            <span className="text-2xl">⚙️</span>
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
