// src/app/dashboard/influencers/page.tsx

"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

type Influencer = inferRouterOutputs<AppRouter>["influencer"]["getAll"][number];

export default function InfluencersPage() {
  const [name, setName] = useState("");
  const [followers, setFollowers] = useState("");
  const [engagement, setEngagement] = useState("");
  
  // Düzenleme modu için state
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);

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
      }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mutation = editingInfluencer ? updateMutation : createMutation;
    mutation.mutate({
      id: editingInfluencer?.id,
      name,
      followerCount: Number(followers),
      engagementRate: Number(engagement),
    } as any); // Tip zorlaması gerekebilir
  };
  
  const handleEdit = (inf: Influencer) => {
      setEditingInfluencer(inf);
      setName(inf.name);
      setFollowers(inf.followerCount.toString());
      setEngagement(inf.engagementRate);
  }

  const handleCancelEdit = () => {
      setEditingInfluencer(null);
      setName("");
      setFollowers("");
      setEngagement("");
  }
  
  const handleDelete = (id: number) => {
      if (window.confirm("Bu influencer'ı silmek istediğinizden emin misiniz?")) {
          deleteMutation.mutate({ id });
      }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">Influencer Management</h1>
      
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form Alanı */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="rounded-lg border p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
                {editingInfluencer ? "Set Influencer" : "Add a new Influencer"}
            </h2>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-lg border px-4 py-2" />
              <input type="number" placeholder="Follower Count" value={followers} onChange={e => setFollowers(e.target.value)} required className="w-full rounded-lg border px-4 py-2" />
              <input type="number" step="0.01" placeholder="Interaction Rate (%)" value={engagement} onChange={e => setEngagement(e.target.value)} required className="w-full rounded-lg border px-4 py-2" />
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

        {/* Liste Alanı */}
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                <thead className="text-left">
                    <tr>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Name</th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Follower</th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Interaction (%)</th>
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
                                    <button onClick={() => handleEdit(inf)} className="text-yellow-600 hover:underline">Set</button>
                                    <button onClick={() => handleDelete(inf.id)} className="text-red-600 hover:underline">Delete</button>
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
  );
}