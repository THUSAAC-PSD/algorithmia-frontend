import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const TypewriterCode = ({ code }: { code: string }) => {
  const [displayedCode, setDisplayedCode] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < code.length) {
      const timeout = setTimeout(() => {
        setDisplayedCode((prevCode) => prevCode + code[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, 50);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, code]);

  return (
    <pre className="overflow-x-auto">
      <code>{displayedCode}</code>
      {currentIndex < code.length && <span className="animate-pulse">|</span>}
    </pre>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen w-full bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-5 flex justify-between items-center border-b border-slate-800">
        <div className="text-2xl font-bold text-indigo-400">Algorithmia</div>
        <div className="flex space-x-6">
          <Link
            to="/signin"
            className="px-5 py-2 rounded hover:bg-slate-800 transition duration-300"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition duration-300"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 flex flex-col items-start mt-8 md:mt-0">
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
            Contribute to Competitive Programming
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Algorithmia is a platform where users can create and submit
            programming problems for Tsinghua's competitive programming
            competitions.
            <br />
            <br />
            Join us in building a high-quality problem bank for the competitive
            programming community.
          </p>
          <div className="flex space-x-4">
            <Link
              to="/signup"
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition duration-300"
            >
              Sign Up for Free
            </Link>
            <Link
              to="/signin"
              className="px-8 py-3 border border-indigo-600 text-indigo-400 font-bold rounded-lg hover:bg-slate-800 transition duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center md:justify-end mt-8 md:mt-0">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-md">
            <div className="text-indigo-400 font-mono mb-4">
              <TypewriterCode
                code={`#include <iostream>
using namespace std;

int main() {
    cout << "Hello, Algorithmia!" << endl;
    return 0;
}`}
              />
            </div>
            <div className="text-sm text-slate-400 italic text-center">
              Create. Verify. Compete. Build the future of competitive
              programming.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
