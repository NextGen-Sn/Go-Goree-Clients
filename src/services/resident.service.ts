import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { LaravelPaginated, unwrapPaginated } from "@/api/normalize";
import { DemandeResidence } from "@/types/resident";

// Un fichier local sélectionné (image ou document) prêt à être uploadé.
export interface UploadFile {
  uri: string;
  name: string;
  mimeType: string;
}

export interface SubmitDemandePayload {
  carteIdentite: string;
  residence: string;
  photo: UploadFile; // requis côté backend (photo d'identité)
  cniRecto?: UploadFile | null;
  cniVerso?: UploadFile | null;
  certificatResidence?: UploadFile | null;
}

interface SubmitResponse {
  message: string;
  demande: DemandeResidence;
}

function appendFile(form: FormData, field: string, file: UploadFile) {
  // React Native attend un objet { uri, name, type } pour un champ fichier.
  form.append(field, { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
}

export const residentService = {
  async submitDemande(payload: SubmitDemandePayload): Promise<DemandeResidence> {
    const form = new FormData();
    form.append("carte_identite", payload.carteIdentite);
    form.append("residence", payload.residence);
    appendFile(form, "photo_file", payload.photo);
    if (payload.cniRecto) appendFile(form, "cni_recto_file", payload.cniRecto);
    if (payload.cniVerso) appendFile(form, "cni_verso_file", payload.cniVerso);
    if (payload.certificatResidence)
      appendFile(form, "certificat_residence_file", payload.certificatResidence);

    const { data } = await apiClient.post<SubmitResponse>(endpoints.residents.demandes, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.demande;
  },

  async listDemandes(): Promise<DemandeResidence[]> {
    const { data } = await apiClient.get<LaravelPaginated<DemandeResidence>>(
      endpoints.residents.demandes
    );
    return unwrapPaginated(data);
  },
};
