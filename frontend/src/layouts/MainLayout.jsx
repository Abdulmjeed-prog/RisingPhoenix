import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import PageLoader from '../components/PageLoader'
import ToastContainer from '../components/ToastContainer'
import ConfirmModal from '../components/ConfirmModal'

export default function MainLayout() {
  return (
    <>
      <PageLoader />
      <Navbar />

      <div className="saaf-layout d-flex">
        <Sidebar />
        <main className="saaf-main flex-grow-1">
          <Outlet />
        </main>
      </div>

      <Footer />
      <ToastContainer />
      <ConfirmModal />
    </>
  )
}