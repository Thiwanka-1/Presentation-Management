import { BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';

import AdminProfile from './pages/AdminProfile';
import ManageUsers from './pages/ManageUsers';
import AddStudent from './pages/Students/AddStudents';
import AddExaminer from './pages/Examiners/AddExaminer';
import AddVenue from './pages/Venues/AddVenue';
import AddPresentation from './pages/Presentations/AddPresentation';
import Modal from "react-modal";

Modal.setAppElement("#root");  // Fixes the warning





export default function App() {
  return <BrowserRouter>
  <Header />
    <Routes>
      <Route path = "/" element = {<Home />} />
      <Route path = "/sign-in" element = {<SignIn />} />
      <Route path = "/sign-up" element = {<SignUp />} />

      <Route element={<PrivateRoute />}>
        <Route path = "/profile" element = {<Profile />} />
        <Route path = "/add-std" element = {<AddStudent />} />
        <Route path = "/add-ex" element = {<AddExaminer />} />
        <Route path = "/add-ven" element = {<AddVenue />} />
        <Route path = "/add-pres" element = {<AddPresentation />} />
        

      </Route>

      <Route element={<PrivateRoute adminOnly={true} />}>
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path='/admin-profile' element={<AdminProfile />} />

        

      </Route>
    </Routes>
  
  </BrowserRouter>
    
}
