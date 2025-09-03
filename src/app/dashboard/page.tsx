// src/app/dashboard/page.tsx

"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useSession, signIn } from "next-auth/react";
import Link from 'next/link';
// Ana Dashboard Bileşeni: Kimlik kontrolü yapar.
// (Bu kısmı önceki adımdan biliyoruz, bir değişiklik yok)
export default function DashboardPage() {
    const { status } = useSession();

    if (status === "loading") {
        return <main className="flex items-center justify-center p-8"><p>Yükleniyor...</p></main>;
    }

    if (status === "unauthenticated") {
        return (
            <main className="flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-2xl font-bold">Erişim Reddedildi</h1>
                <p className="mb-4">Bu sayfayı görmek için lütfen giriş yapın.</p>
                <button
                    onClick={() => void signIn("github")}
                    className="rounded-full bg-black/10 px-10 py-3 font-semibold no-underline transition hover:bg-black/20"
                >
                    Giriş Yap
                </button>
            </main>
        );
    }

    return <DashboardContent />;
}

// Asıl İçerik Bileşeni: Arayüz ve işlevsellik burada.
function DashboardContent() {
    const utils = api.useUtils();
    const { data: campaigns, isLoading } = api.campaign.getAll.useQuery();
    const createCampaign = api.campaign.create.useMutation({
        onSuccess: () => {
            void utils.campaign.getAll.invalidate();
            setTitle("");
            setDescription("");
            setBudget("");
        },
        onError: (error) => {
            alert(`Kampanya oluşturulamadı: ${error.message}`);
        },
    });

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const budgetNumber = parseInt(budget);
        if (isNaN(budgetNumber) || budgetNumber <= 0) {
            alert("Lütfen geçerli ve pozitif bir bütçe girin.");
            return;
        }
        createCampaign.mutate({
            title,
            description,
            budget: budgetNumber,
            startDate: new Date(),
            endDate: new Date(),
        });
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {/* Üst Başlık Alanı */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Campaign Panels</h1>
                <p className="text-muted-foreground text-gray-500">Manage current campaigns and create new ones.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Sol Taraf: Form */}
                <div className="lg:col-span-1">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h2 className="text-xl font-semibold">Create New Campaign</h2>
                        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder="Title of Campaign"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-lg border px-4 py-2"
                                required
                            />
                            <textarea
                                placeholder="Description (Optional)"
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

                {/* Sağ Taraf: Kampanya Listesi */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold">Campaigns</h2>
                    {isLoading && <p className="mt-4">Campaigns are Loading...</p>}

                    {/* Kampanya Kartları Grid'i */}
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {campaigns?.map((campaign) => (
                            <Link
                                key={campaign.id}
                                href={`/dashboard/campaign/${campaign.id}`} // Bu linki ekliyoruz
                                className="block" // Link'in tüm alanı kaplaması için
                            >
                                <div className="h-full rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-500">
                                    <h3 className="font-bold text-lg">{campaign.title}</h3>
                                    <p className="mt-1 text-sm text-gray-600 flex-grow">{campaign.description || "No description."}</p>
                                    <p className="mt-2 text-right font-semibold text-blue-700">{campaign.budget.toLocaleString()} $</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {!isLoading && campaigns?.length === 0 && (
                        <div className="mt-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                            <p className="text-gray-500">You haven't created a campaign yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}