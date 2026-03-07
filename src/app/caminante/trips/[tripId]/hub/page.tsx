interface TripHubPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function TripHubPage({ params }: TripHubPageProps) {
  const { tripId } = await params;

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Trip Hub</h2>
      <p className="text-stone-600">
        Centralized success state: itinerary, calendar actions, WhatsApp group, and support.
      </p>
      <p className="text-stone-600">Trip ID: {tripId}</p>
    </section>
  );
}
