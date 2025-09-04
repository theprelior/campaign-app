"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useSession, signIn } from "next-auth/react";
import Link from 'next/link';
import InfoModal from "../_components/infoModal"; // Step 1: Import the modal component

// Main Dashboard Component: Handles authentication checks.
export default function DashboardPage() {
  const { status } = useSession();

  if (status === "loading") {
    return <main className="flex items-center justify-center p-8"><p>Loading...</p></main>;
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mb-4">Please sign in to view this page.</p>
        <button
          onClick={() => void signIn("github")}
          className="rounded-full bg-black/10 px-10 py-3 font-semibold no-underline transition hover:bg-black/20"
        >
          Sign In
        </button>
      </main>
    );
  }

  return <DashboardContent />;
}

// Main Content Component: Contains the UI and functionality.
function DashboardContent() {
  const utils = api.useUtils();
  const { data: campaigns, isLoading } = api.campaign.getAll.useQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Step 2: Add state for the info modal
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState({ title: "", message: "" });

  const createCampaign = api.campaign.create.useMutation({
    onSuccess: () => {
      void utils.campaign.getAll.invalidate();
      // Reset all form fields on success
      setTitle("");
      setDescription("");
      setBudget("");
      setStartDate("");
      setEndDate("");
    },
    onError: (error) => {
      // Also use the modal for API errors
      setInfoModalContent({ title: "Creation Failed", message: error.message });
      setIsInfoModalOpen(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNumber = parseInt(budget);

    // Step 3: Replace all alerts with logic to open the modal
    if (isNaN(budgetNumber) || budgetNumber <= 0) {
      setInfoModalContent({ title: "Invalid Budget", message: "Please enter a valid, positive number for the budget." });
      setIsInfoModalOpen(true);
      return;
    }
    if (!startDate || !endDate) {
      setInfoModalContent({ title: "Missing Dates", message: "Please select both a start and end date for the campaign." });
      setIsInfoModalOpen(true);
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setInfoModalContent({ title: "Invalid Date Range", message: "The campaign's end date cannot be before its start date." });
      setIsInfoModalOpen(true);
      return;
    }

    createCampaign.mutate({
      title,
      description,
      budget: budgetNumber,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  };

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Campaign Dashboard</h1>
          <p className="text-muted-foreground text-gray-500">Manage your existing campaigns and create new ones.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Side: Form */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Create New Campaign</h2>
              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Campaign Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2"
                />
                <input
                  type="number"
                  placeholder="Budget ($)"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2"
                  required
                />
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={createCampaign.isPending}
                >
                  {createCampaign.isPending ? "Creating..." : "Create Campaign"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Side: Campaign List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold">Existing Campaigns</h2>
            {isLoading && <p className="mt-4">Loading campaigns...</p>}
            
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {campaigns?.map((campaign) => (
                <Link 
                  key={campaign.id} 
                  href={`/dashboard/campaign/${campaign.id}`}
                  className="block"
                >
                  <div className="h-full rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md">
                    <h3 className="text-lg font-bold">{campaign.title}</h3>
                    <p className="mt-1 flex-grow text-sm text-gray-600">{campaign.description || "No description provided."}</p>
                    <p className="mt-2 text-right font-semibold text-blue-700">${campaign.budget.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>

            {!isLoading && campaigns?.length === 0 && (
              <div className="mt-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500">You haven't created any campaigns yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Step 4: Render the modal and connect it to state */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title={infoModalContent.title}
        message={infoModalContent.message}
      />
    </>
  );
}

