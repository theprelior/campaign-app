// src/app/dashboard/campaign/[id]/page.tsx

"use client"; // Bu satırı dosyanın en üstünde tutuyoruz.

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

// Tipleri dosyanın en üstünde tanımlıyoruz
type CampaignWithInfluencers = inferRouterOutputs<AppRouter>["campaign"]["getById"];

// Prop tipi için yeni tanımımız
type CampaignDetailPageProps = {
  params: { id: string };
};

// ANA SAYFA BİLEŞENİ (default export)
// Bu bileşen, prop tipini kullanarak hatayı çözüyor.
export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const campaignId = Number(params.id);

  // ID'nin geçerli bir sayı olup olmadığını kontrol ediyoruz.
  // Eğer değilse, hata mesajı gösterip client tarafı mantığını hiç çalıştırmıyoruz.
  if (isNaN(campaignId)) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-red-500">Invalid Campaign ID.</p>
      </div>
    );
  }

  return <CampaignClientPage campaignId={campaignId} />;
}


// TÜM MANTIĞI İÇEREN CLIENT BİLEŞENİ
function CampaignClientPage({ campaignId }: { campaignId: number }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: campaign, isLoading, error } = api.campaign.getById.useQuery({ id: campaignId });
  
  const [title, setTitle] = useState(campaign?.title ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [budget, setBudget] = useState(campaign?.budget.toString() ?? "");
  
  const utils = api.useUtils();

  const deleteMutation = api.campaign.delete.useMutation({
    onSuccess: () => {
      void utils.campaign.getAll.invalidate();
      router.push("/dashboard");
    },
  });
  
  const updateMutation = api.campaign.update.useMutation({
      onSuccess: () => {
          void utils.campaign.getById.invalidate({id: campaignId});
          void utils.campaign.getAll.invalidate();
          setIsEditing(false);
      }
  })

  const handleDelete = () => {
    if (window.confirm("Are you sure that to delete this campaign.")) {
      deleteMutation.mutate({ id: campaignId });
    }
  };
  
  const handleUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      updateMutation.mutate({
          id: campaignId,
          title,
          description,
          budget: Number(budget)
      })
  }
  
  const startEditing = () => {
      setTitle(campaign?.title ?? "");
      setDescription(campaign?.description ?? "");
      setBudget(campaign?.budget.toString() ?? "");
      setIsEditing(true);
  }

  if (isLoading) return <div className="container mx-auto p-8">Loading...</div>;
  if (error) return <div className="container mx-auto p-8 text-red-500">Error: {error.message}</div>;
  if (!campaign) return <div className="container mx-auto p-8">Couldn't find the campaign.</div>;

  return (
    <div className="container mx-auto p-8">
        <div className="mb-6">
            <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-blue-600"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Back to All Campaigns
            </Link>
        </div>

        {isEditing ? (
            <form onSubmit={handleUpdate} className="rounded-lg border p-6 shadow-md">
                <h1 className="text-2xl font-bold mb-4">Edit the Campaign</h1>
                <div className="flex flex-col gap-4">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border px-4 py-2" />
                    <textarea value={description ?? ""} onChange={e => setDescription(e.target.value)} className="w-full rounded-lg border px-4 py-2" />
                    <input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="w-full rounded-lg border px-4 py-2" />
                    <div className="flex gap-4">
                        <button type="submit" className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? "Saving..." : "Save"}
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg bg-gray-500 px-6 py-2 font-semibold text-white">Cancel</button>
                    </div>
                </div>
            </form>
        ) : (
            <>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold">{campaign.title}</h1>
                        <p className="mt-2 text-lg text-gray-600">{campaign.description}</p>
                        <p className="mt-4 text-2xl font-semibold text-blue-700">{campaign.budget.toLocaleString()} TL Budget</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={startEditing} className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-white">Düzenle</button>
                        <button onClick={handleDelete} disabled={deleteMutation.isPending} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:bg-gray-400">
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>
                
                <div className="my-10 border-t pt-10">
                    <h2 className="text-2xl font-bold mb-4">Assigned Influencers</h2>
                    <AssignedInfluencersList campaign={campaign} />
                </div>
                <div className="my-10 border-t pt-10">
                    <h2 className="text-2xl font-bold mb-4">New Influencer Assign</h2>
                    <AssignInfluencer campaign={campaign} />
                </div>
            </>
        )}
    </div>
  );
}



function AssignedInfluencersList({ campaign }: { campaign: CampaignWithInfluencers }) {
    // ...
    const utils = api.useUtils();
    const removeMutation = api.campaign.removeInfluencer.useMutation({
        onSuccess: () => {
            utils.campaign.getById.invalidate({ id: campaign.id });
        }
    });

    const assignedInfluencers = campaign.campaignsToInfluencers.map(item => item.influencer);

    if (assignedInfluencers.length === 0) {
        return <p className="text-gray-500">There isn't any assigned Influencer to this Campaign.</p>
    }
    
    return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {assignedInfluencers.map(inf => (
                <li key={inf.id} className="rounded-lg border p-4 flex justify-between items-center">
                    <div>
                        <p className="font-bold">{inf.name}</p>
                        <p className="text-sm text-gray-600">{inf.followerCount.toLocaleString()} Follower</p>
                    </div>
                    <button 
                        onClick={() => removeMutation.mutate({ campaignId: campaign.id, influencerId: inf.id })}
                        className="text-red-500 hover:underline text-sm"
                    >
                        Remove
                    </button>
                </li>
            ))}
        </ul>
    )
}

function AssignInfluencer({ campaign }: { campaign: CampaignWithInfluencers }) {
    // ...
    const { data: allInfluencers } = api.influencer.getAll.useQuery();
    const utils = api.useUtils();
    const assignMutation = api.campaign.assignInfluencer.useMutation({
        onSuccess: () => {
            utils.campaign.getById.invalidate({ id: campaign.id });
        }
    });
    
    const assignedInfluencerIds = new Set(campaign.campaignsToInfluencers.map(item => item.influencer.id));
    const availableInfluencers = allInfluencers?.filter(inf => !assignedInfluencerIds.has(inf.id));

    return (
        <div className="max-w-md">
            <select
                onChange={(e) => {
                    const influencerId = Number(e.target.value);
                    if (!influencerId) return;
                    assignMutation.mutate({ campaignId: campaign.id, influencerId });
                    e.target.value = ""; // Seçimi sıfırla
                }}
                className="w-full rounded-lg border px-4 py-2"
                disabled={!availableInfluencers || availableInfluencers.length === 0}
            >
                <option value="">Chose an Influencer...</option>
                {availableInfluencers?.map(inf => (
                    <option key={inf.id} value={inf.id}>
                        {inf.name} ({inf.followerCount.toLocaleString()} Follower)
                    </option>
                ))}
            </select>
            {!availableInfluencers || availableInfluencers.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">There is no available Influencer.</p>
            )}
        </div>
    )
}