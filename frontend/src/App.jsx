import { useState, useEffect } from 'react'

function App() {
  const [balance, setBalance] = useState(null)
  const [forecast, setForecast] = useState([])
  const [nudge, setNudge] = useState('')
  const [riskLevel, setRiskLevel] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      // Try to fetch from backend
      const forecastRes = await fetch('http://localhost:8000/api/forecast')
      const nudgeRes = await fetch('http://localhost:8000/api/nudge')

      if (!forecastRes.ok || !nudgeRes.ok) {
        throw new Error('Backend error')
      }

      const forecastData = await forecastRes.json()
      const nudgeData = await nudgeRes.json()

      // Adapt Backend Data to UI
      const adaptedForecast = (forecastData.forecast || []).map(item => ({
        day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
        amount: item.balance
      }))

      setForecast(adaptedForecast)

      setNudge(nudgeData.message || '') // Backend returns 'message'
      setRiskLevel(nudgeData.risk_level || null)

      // Use the last forecast balance as the current total balance
      if (forecastData.forecast && forecastData.forecast.length > 0) {
        setBalance(forecastData.forecast[0].balance)
      } else {
        setBalance(0)
      }

    } catch (error) {
      console.log('Fetching failed, using mock data', error)
      // Fallback Mock Data
      setBalance(850)
      setForecast([
        { day: 'Mon', amount: 120 },
        { day: 'Tue', amount: 90 },
        { day: 'Wed', amount: 40 },
        { day: 'Thu', amount: 200 },
        { day: 'Fri', amount: 350 },
      ])
      setNudge('This is a demo nudge.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddIncome = async () => {
    const amountStr = window.prompt("Enter income amount (₹):")
    if (!amountStr) return

    const amount = parseFloat(amountStr)
    if (isNaN(amount)) {
      alert("Please enter a valid number")
      return
    }

    try {
      const res = await fetch('http://localhost:8000/api/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      if (res.ok) {
        // Refresh data without reloading page
        await fetchData()
      } else {
        alert("Failed to add income")
      }
    } catch (error) {
      console.error("Error adding income:", error)
      alert("Error connecting to backend")
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            FinAgent
          </h1>
          <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
        </header>

        {/* Balance Card */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
          <h2 className="text-gray-400 text-sm font-medium">Total Balance</h2>
          <div className="text-4xl font-bold mt-2">
            ₹{balance !== null ? balance : '---'}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddIncome}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition"
            >
              Add Income
            </button>
            <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium transition">
              Withdraw
            </button>
          </div>
        </div>

        {/* Nudge Card */}
        <div className={`rounded-2xl p-6 border ${riskLevel === 'Critical' ? 'bg-red-900/20 border-red-500' : 'bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-blue-500/30'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Smart Nudge</h3>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                {nudge || 'Loading nudge...'}
              </p>
            </div>
          </div>
        </div>

        {/* Forecast Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Weekly Forecast</h3>
          <div className="space-y-3">
            {forecast.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-10 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-200">{item.day}</span>
                </div>
                <span className="font-bold text-green-400">₹{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
