import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4">
        <h2 className="text-xl">Welcome to Task Manager</h2>
        <Link to="/login" className="text-blue-500">
          Go to Login
        </Link>
      </main>
      <Footer />
    </div>
  );
}
