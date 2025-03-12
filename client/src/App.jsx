import { BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ExaminerProfile from './pages/ExaminerProfile';
import StudentProfile from './pages/StudentProfile';

import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';

import AdminProfile from './pages/AdminProfile';
import ManageUsers from './pages/ManageUsers';
import AddStudent from './pages/Students/AddStudents';
import AddExaminer from './pages/Examiners/AddExaminer';
import AddVenue from './pages/Venues/AddVenue';
import AddPresentation from './pages/Presentations/AddPresentation';
import AdminViewPresentations from './pages/Presentations/AdminViewPresentations';
import AdminViewStudents from './pages/Students/AdminViewStudents';
import ExaminerViewPresentations from './pages/Examiners/ExaminerViewPresentations';
import StudentViewPresentations from './pages/Students/StudentViewPresentations';
import AdminViewExaminers from './pages/Examiners/AdminViewExaminers';
import AdminViewVenues from './pages/Venues/AdminViewVenues';
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
        <Route path = "/profile" element = {<ExaminerProfile />} />

        <Route path = "/add-std" element = {<AddStudent />} />
        <Route path = "/add-ex" element = {<AddExaminer />} />
        <Route path = "/add-ven" element = {<AddVenue />} />
        <Route path = "/add-pres" element = {<AddPresentation />} />
        
        <Route path = "/admin-pres-view" element = {<AdminViewPresentations />} />
        <Route path = "/admin-std-view" element = {<AdminViewStudents />} />
        <Route path = "/admin-ex-view" element = {<AdminViewExaminers />} />
        <Route path = "/admin-ven-view" element = {<AdminViewVenues />} />


        <Route path = "/ex-pres-view" element = {<ExaminerViewPresentations />} />
        <Route path = "/std-pres-view" element = {<StudentViewPresentations />} />


      </Route>

      <Route element={<PrivateRoute adminOnly={true} />}>
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path='/admin-profile' element={<AdminProfile />} />

        

      </Route>

      <Route element={<PrivateRoute studentOnly={true} />}>
        <Route path = "/student-profile" element = {<StudentProfile />} />


        

      </Route>

      <Route element={<PrivateRoute examinerOnly={true} />}>
        

        

      </Route>
    </Routes>
  
  </BrowserRouter>
    
}
