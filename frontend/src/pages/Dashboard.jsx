import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <p>Welcome to your task management dashboard!</p>
      </main>
      <Footer />
    </div>
  );
}
