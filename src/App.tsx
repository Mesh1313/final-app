import './App.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import Root from './scenes/Root'
import useInitializeTracking from './hooks/useInitializeTracking'

function App() {
  useInitializeTracking()

  return (
    <Root />
  )
}

export default App
