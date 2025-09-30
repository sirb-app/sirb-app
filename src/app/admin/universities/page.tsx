import { listUniversitiesAction } from "@/actions/university.actions";
import UniversitiesManager from "./_components/universities-manager";

export default async function Page() {
  const universities = await listUniversitiesAction();
  return <UniversitiesManager universities={universities} />;
}
