import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import Home from './pages/Home'
import Review from './pages/Review'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="review" element={<Review />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
