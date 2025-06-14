import Header from '../components/Header';
import Footer from '../components/Footer';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4">
        <h2 className="text-xl">Hello to Task Manager</h2>
      </main>
      <Footer />
    </div>
  );
}
