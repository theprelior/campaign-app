// src/app/dashboard/campaign/[id]/page.tsx

"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

type CampaignWithInfluencers = inferRouterOutputs<AppRouter>["campaign"]["getById"];
type Influencer = inferRouterOutputs<AppRouter>["influencer"]["getAll"][number];

// --- DEĞİŞİKLİK BURADA BAŞLIYOR ---

// Sayfa prop'ları için daha net bir tip tanımı oluşturuyoruz.
type CampaignDetailPageProps = {
  params: { id: string };
};

// Fonksiyon imzasında bu yeni tipi kullanıyoruz.
export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  // --- DEĞİŞİKLİK BURADA BİTİYOR ---
  
  const router = useRouter();
  const campaignId = Number(params.id);
  
  // ... dosyanın geri kalanında HİÇBİR DEĞİŞİKLİK YOK ...
  const [isEditing, setIsEditing] = useState(false);
  const { data: campaign, isLoading, error } = api.campaign.getById.useQuery({ id: campaignId });
  
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
           Tüm Kampanyalara Geri Dön
        </Link>
      </div>

      {isLoading && <p>Yükleniyor...</p>}
      {error && <p className="text-red-500">Hata: {error.message}</p>}
      
      {campaign && (
        <>
            <CampaignDetails campaign={campaign} />
            <div className="my-10 border-t pt-10">
                <h2 className="text-2xl font-bold mb-4">Atanmış Influencer'lar</h2>
                <AssignedInfluencersList campaign={campaign} />
            </div>
            <div className="my-10 border-t pt-10">
                <h2 className="text-2xl font-bold mb-4">Yeni Influencer Ata</h2>
                <AssignInfluencer campaign={campaign} />
            </div>
        </>
      )}
    </div>
  );
}

// --- SAYFANIN GERİ KALANI AYNI ---

function CampaignDetails({ campaign }: { campaign: CampaignWithInfluencers }) {
    // ...
    return (
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold">{campaign.title}</h1>
              <p className="mt-2 text-lg text-gray-600">{campaign.description}</p>
              <p className="mt-4 text-2xl font-semibold text-blue-700">{campaign.budget.toLocaleString()} TL Bütçe</p>
            </div>
          </div>
        </div>
    )
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
        return <p className="text-gray-500">Bu kampanyaya henüz bir influencer atanmamış.</p>
    }
    
    return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {assignedInfluencers.map(inf => (
                <li key={inf.id} className="rounded-lg border p-4 flex justify-between items-center">
                    <div>
                        <p className="font-bold">{inf.name}</p>
                        <p className="text-sm text-gray-600">{inf.followerCount.toLocaleString()} takipçi</p>
                    </div>
                    <button 
                        onClick={() => removeMutation.mutate({ campaignId: campaign.id, influencerId: inf.id })}
                        className="text-red-500 hover:underline text-sm"
                    >
                        Kaldır
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
                <option value="">Bir influencer seçin...</option>
                {availableInfluencers?.map(inf => (
                    <option key={inf.id} value={inf.id}>
                        {inf.name} ({inf.followerCount.toLocaleString()} Takipçi)
                    </option>
                ))}
            </select>
            {!availableInfluencers || availableInfluencers.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">Atanacak uygun influencer bulunmuyor.</p>
            )}
        </div>
    )
}