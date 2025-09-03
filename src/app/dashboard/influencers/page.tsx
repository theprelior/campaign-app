"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import ConfirmationModal from "~/app/_components/confirmationModal"; // Importing our modal component

type Influencer = inferRouterOutputs<AppRouter>["influencer"]["getAll"][number];

export default function InfluencersPage() {
  const [name, setName] = useState("");
  const [followers, setFollowers] = useState("");
  const [engagement, setEngagement] = useState("");
  
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [influencerToDelete, setInfluencerToDelete] = useState<Influencer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const utils = api.useUtils();
  const { data: influencers, isLoading } = api.influencer.getAll.useQuery();

  const createMutation = api.influencer.create.useMutation({
    onSuccess: () => {
      utils.influencer.getAll.invalidate();
      setName("");
      setFollowers("");
      setEngagement("");
    },
  });
  
  const updateMutation = api.influencer.update.useMutation({
    onSuccess: () => {
      utils.influencer.getAll.invalidate();
      setEditingInfluencer(null);
      setName("");
      setFollowers("");
      setEngagement("");
    },
  });
  
  const deleteMutation = api.influencer.delete.useMutation({
      onSuccess: () => {
          utils.influencer.getAll.invalidate();
          setIsModalOpen(false);
          setInfluencerToDelete(null);
      }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const commonData = {
      name,
      followerCount: Number(followers),
      engagementRate: Number(engagement),
    };

    if (editingInfluencer) {
      updateMutation.mutate({
        id: editingInfluencer.id,
        ...commonData
      });
    } else {
      createMutation.mutate(commonData);
    }
  };
  
  const handleEdit = (inf: Influencer) => {
      setEditingInfluencer(inf);
      setName(inf.name);
      setFollowers(inf.followerCount.toString());
      setEngagement(inf.engagementRate);
  };

  const handleCancelEdit = () => {
      setEditingInfluencer(null);
      setName("");
      setFollowers("");
      setEngagement("");
  };
  
  const openDeleteModal = (inf: Influencer) => {
    setInfluencerToDelete(inf);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (influencerToDelete) {
      deleteMutation.mutate({ id: influencerToDelete.id });
    }
  };

  return (
    <>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold">Influencer Management</h1>
        
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Form Area */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="rounded-lg border p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">
                  {editingInfluencer ? "Edit Influencer" : "Add New Influencer"}
              </h2>
              <div className="flex flex-col gap-4">
                <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-lg border px-4 py-2" />
                <input type="number" placeholder="Follower Count" value={followers} onChange={e => setFollowers(e.target.value)} required className="w-full rounded-lg border px-4 py-2" />
                <input type="number" step="0.01" placeholder="Engagement Rate (%)" value={engagement} onChange={e => setEngagement(e.target.value)} required className="w-full rounded-lg border px-4 py-2" />
                <div className="flex gap-2">
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white disabled:bg-gray-400">
                      {editingInfluencer ? "Update" : "Add"}
                  </button>
                  {editingInfluencer && (
                      <button type="button" onClick={handleCancelEdit} className="rounded-lg bg-gray-500 px-6 py-2 font-semibold text-white">Cancel</button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* List Area */}
          <div className="lg:col-span-2">
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="text-left">
                      <tr>
                          <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Name</th>
                          <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Followers</th>
                          <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Engagement (%)</th>
                          <th className="px-4 py-2"></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      {isLoading && <tr><td colSpan={4} className="text-center p-4">Loading...</td></tr>}
                      {influencers?.map(inf => (
                          <tr key={inf.id}>
                              <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">{inf.name}</td>
                              <td className="whitespace-nowrap px-4 py-2 text-gray-700">{inf.followerCount.toLocaleString()}</td>
                              <td className="whitespace-nowrap px-4 py-2 text-gray-700">{inf.engagementRate}</td>
                              <td className="whitespace-nowrap px-4 py-2">
                                  <div className="flex gap-2">
                                      <button onClick={() => handleEdit(inf)} className="text-yellow-600 hover:underline font-medium">Edit</button>
                                      <button onClick={() => openDeleteModal(inf)} className="text-red-600 hover:underline font-medium">Delete</button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Influencer"
        message={`Are you sure you want to permanently delete "${influencerToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isConfirming={deleteMutation.isPending}
      />
    </>
  );
}
