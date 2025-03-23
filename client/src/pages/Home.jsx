import React from "react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full bg-white p-8 rounded-lg shadow-lg">
        {/* Title / Hero Section */}
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">
          Welcome to the Presentation Scheduling Management System
        </h1>
        <p className="text-lg text-center text-gray-600 mb-6">
          Seamlessly schedule, manage, and reschedule your presentations with an
          intuitive interface. Avoid conflicts and stay organized with powerful
          automation.
        </p>

        {/* Highlighted Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-md shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Automated Timetables
            </h2>
            <p className="text-sm text-gray-600">
              Let our system handle the complexities of scheduling. Just specify
              your details, and we'll generate a conflict-free timetable for
              your presentations.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Smart Rescheduling
            </h2>
            <p className="text-sm text-gray-600">
              Request a new time slot, and our system will suggest the best
              options, instantly checking for conflicts and availability.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Conflict Detection
            </h2>
            <p className="text-sm text-gray-600">
              No more overlapping sessions! We perform real-time checks to avoid
              venue or examiner clashes, ensuring a smooth scheduling process.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Email Notifications
            </h2>
            <p className="text-sm text-gray-600">
              Stay informed with automatic email alerts for newly scheduled or
              rescheduled presentations. Keep everyone on the same page.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block bg-blue-600 text-white text-xl font-semibold py-3 px-6 rounded-md shadow-md hover:bg-blue-700 transition duration-300"
          >
            View Presentations
          </a>
        </div>

        {/* Footer / Info */}
        <div className="mt-8 border-t pt-6 text-center">
          <p className="text-sm text-gray-500">
            Built with React, Node, Express, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
