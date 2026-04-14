export type Desk = 'Arthur' | 'Boost33' | 'Advisor';

export interface Post {
  id: string;
  url: string;
  type: string;
  note: string | null;
  status: 'pending' | 'scraping' | 'done';
  profile_count: number;
  desk: Desk;
  created_at: string;
}

export interface FilterSession {
  id: string;
  desk: Desk;
  total: number;
  matched: number;
  dupes: number;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  sector: string | null;
  persona: string | null;
  lang: string;
  message: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  desk: Desk;
  template_id: string | null;
  template_used: string | null;
  start_date: string | null;
  contacts_count: number;
  status: 'draft' | 'ready' | 'active' | 'paused' | 'completed';
  schedule_json: ScheduleConfig;
  webhook_url: string | null;
  prosp_api_key: string | null;
  created_at: string;
}

export interface ScheduleConfig {
  start_time?: string;
  end_time?: string;
  active_days?: string[];
  max_per_day?: number;
  delay_seconds?: number;
}

export interface PipelineStat {
  id: string;
  desk: Desk;
  week: string;
  sent: number;
  accepted: number;
  replies: number;
  rdv: number;
  campaign_id: string | null;
  created_at: string;
}

export type Qualification = 'CHAUD' | 'TIEDE' | 'FROID';
export type NextAction = 'RDV booké' | 'Relance' | 'Pas intéressé';
export type LeadStatus = 'À contacter' | 'Appelé' | 'RDV booké' | 'Pas intéressé' | 'Sans réponse';

export const LEAD_STATUSES: LeadStatus[] = [
  'À contacter',
  'Appelé',
  'RDV booké',
  'Pas intéressé',
  'Sans réponse',
];

export interface LeadQualification {
  id: string;
  contact_name: string;
  company: string;
  reply_content: string;
  qualification: Qualification;
  next_action: NextAction;
  campaign_id: string | null;
  desk: Desk;
  linkedin_url: string | null;
  status: LeadStatus;
  updated_at: string | null;
  updated_by: string | null;
  created_at: string;
}

export type DatePreset = 'today' | 'this_week' | 'this_month' | 'last_month';

export interface DateRange {
  from: string;
  to: string;
}

export interface TeamProfile {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  job_title: string;
  linkedin_url: string;
  desk: Desk;
  prosp_api_key: string | null;
  created_at: string;
}

export interface CampaignStat {
  id: string;
  desk: Desk;
  campaign_name: string;
  invitations_sent: number;
  connections_accepted: number;
  acceptance_rate: number;
  replies_received: number;
  reply_rate: number;
  status: 'active' | 'paused' | 'completed' | 'draft';
  synced_at: string;
}

export const DESKS: Desk[] = ['Arthur', 'Boost33', 'Advisor'];

export const CEO_TITLES = [
  'CEO', 'Founder', 'Co-Founder', 'Co Founder',
  'PDG', 'DG', 'Directeur Général', 'Directeur General',
  'Gérant', 'Gerant', 'Président', 'President',
  'Fondateur', 'Cofondateur', 'Co-Fondateur',
  'Managing Director', 'Owner', 'Entrepreneur',
];
