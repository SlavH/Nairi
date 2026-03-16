/**
 * Tempmail Detection & Abuse Prevention System
 * 
 * This system implements a sophisticated approach to handling temporary email addresses:
 * - Detection: Identifies tempmail domains
 * - Risk Scoring: Assesses abuse risk based on patterns
 * - Graduated Response: Allows tempmail with appropriate safeguards
 * - Abuse Prevention: Tracks and limits abuse patterns
 */

import { createClient } from '@/lib/supabase/client';

// Known disposable email domains
const TEMPMAIL_DOMAINS = [
  // Major tempmail services
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'mailinator.com', 'dnsclick.com',
  '10minutemail.com', 'throwaway.email', 'fakeinbox.com', 'trashmail.com',
  'yopmail.com', 'coswz.com', 'daikoa.com', 'sharklasers.com', 'guerrillamail.info',
  'grr.la', 'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.net',
  'guerrillamail.org', 'spam4.me', 'getairmail.com', 'mohmal.com',
  // Domains found during testing (Session 31)
  'nesopf.com', '10minutemail.net', '10minutemail.org', 'temp-mail.io',
  'tempmail.net', 'burnermail.io', 'mailsac.com', 'inboxkitten.com',
  // Additional domains
  'juhxs.com', 'tempail.com', 'tempr.email', 'discard.email', 'discardmail.com',
  'disposablemail.com', 'emailondeck.com', 'getnada.com', 'maildrop.cc',
  'mailnesia.com', 'mintemail.com', 'mt2015.com', 'mytemp.email', 'nada.email',
  'spamgourmet.com', 'tempinbox.com', 'tempmailaddress.com', 'tmpmail.org',
  'tmpmail.net', 'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
  'mailcatch.com', 'mailexpire.com', 'mailforspam.com', 'meltmail.com',
  'anonymbox.com', 'binkmail.com', 'bobmail.info', 'burnthespam.info',
  'buyusedlibrarybooks.org', 'byom.de', 'cool.fr.nf', 'correo.blogos.net',
  'cosmorph.com', 'courriel.fr.nf', 'curryworld.de', 'cust.in',
  'dacoolest.com', 'dandikmail.com', 'deadaddress.com', 'despam.it',
  'devnullmail.com', 'dfgh.net', 'digitalsanctuary.com', 'discardmail.de',
  'disposableinbox.com', 'disposeamail.com', 'dispostable.com', 'dm.w3internet.co.uk',
  'dodgeit.com', 'dodgit.com', 'dodgit.org', 'dontreg.com', 'dontsendmespam.de',
  'drdrb.com', 'dump-email.info', 'dumpandjunk.com', 'dumpmail.de', 'dumpyemail.com',
  'e4ward.com', 'easytrashmail.com', 'einmalmail.de', 'email60.com',
  'emaildienst.de', 'emailgo.de', 'emailias.com', 'emailigo.de',
  'emailinfive.com', 'emaillime.com', 'emailmiser.com', 'emailsensei.com',
  'emailtemporanea.com', 'emailtemporanea.net', 'emailtemporar.ro', 'emailtemporario.com.br',
  'emailthe.net', 'emailtmp.com', 'emailto.de', 'emailwarden.com', 'emailx.at.hm',
  'emailxfer.com', 'emz.net', 'enterto.com', 'ephemail.net', 'etranquil.com',
  'etranquil.net', 'etranquil.org', 'evopo.com', 'explodemail.com', 'express.net.ua'
];

export interface TempmailCheckResult {
  isTempmail: boolean;
  domain: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  allowed: boolean;
  reason?: string;
  requiresVerification?: boolean;
  accountsFromDomain?: number;
}

/**
 * Check if an email is from a temporary email provider
 */
export function isTempmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return TEMPMAIL_DOMAINS.includes(domain);
}

/**
 * Get the domain from an email address
 */
export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

/**
 * Comprehensive tempmail check with risk assessment
 * This function implements the graduated response system
 */
export async function checkTempmailRisk(email: string): Promise<TempmailCheckResult> {
  const domain = getEmailDomain(email);
  const isTmp = isTempmail(email);

  // If not tempmail, allow immediately
  if (!isTmp) {
    return {
      isTempmail: false,
      domain,
      riskLevel: 'low',
      allowed: true
    };
  }

  // For tempmail, assess risk level
  try {
    const supabase = createClient();
    
    // Check how many accounts exist from this domain
    const { count: domainCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .ilike('email', `%@${domain}`);

    const accountsFromDomain = domainCount || 0;

    // Risk assessment based on domain usage
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let allowed = true;
    let reason = '';
    let requiresVerification = false;

    if (accountsFromDomain === 0) {
      // First account from this tempmail domain - LOW RISK
      riskLevel = 'low';
      allowed = true;
      reason = 'First account from this domain. Monitoring enabled.';
    } else if (accountsFromDomain < 5) {
      // Few accounts - MEDIUM RISK
      riskLevel = 'medium';
      allowed = true;
      requiresVerification = true;
      reason = `${accountsFromDomain} accounts exist from this domain. Additional verification may be required.`;
    } else if (accountsFromDomain < 20) {
      // Many accounts - HIGH RISK
      riskLevel = 'high';
      allowed = true;
      requiresVerification = true;
      reason = `High usage detected (${accountsFromDomain} accounts). Account will have limited features initially.`;
    } else {
      // Excessive accounts - CRITICAL RISK
      riskLevel = 'critical';
      allowed = false;
      reason = `This email domain has been used excessively (${accountsFromDomain}+ accounts). Please use a different email provider.`;
    }

    return {
      isTempmail: true,
      domain,
      riskLevel,
      allowed,
      reason,
      requiresVerification,
      accountsFromDomain
    };
  } catch (error) {
    console.error('Error checking tempmail risk:', error);
    // On error, allow but mark as medium risk
    return {
      isTempmail: true,
      domain,
      riskLevel: 'medium',
      allowed: true,
      reason: 'Unable to verify domain usage. Proceeding with caution.',
      requiresVerification: true
    };
  }
}

/**
 * Log tempmail usage for monitoring and abuse detection.
 * Persists to public.tempmail_usage_log when the table exists (run scripts/019_create_tempmail_log.sql).
 */
export async function logTempmailUsage(email: string, action: 'signup' | 'login', metadata?: Record<string, unknown>) {
  try {
    const supabase = createClient();
    const domain = getEmailDomain(email);

    console.log('[TEMPMAIL MONITOR]', {
      email,
      domain,
      action,
      timestamp: new Date().toISOString(),
      metadata,
    });

    const { error } = await supabase.from('tempmail_usage_log').insert({
      email_domain: domain,
      action,
      metadata: metadata ?? {},
    });

    if (error) {
      // Table may not exist yet; log but don't throw
      console.warn('Tempmail log insert failed (table may not exist):', error.message);
    }
  } catch (error) {
    console.error('Error logging tempmail usage:', error);
  }
}

/**
 * Apply restrictions to tempmail accounts
 * This can be used to limit features for high-risk accounts
 */
export function getTempmailRestrictions(riskLevel: 'low' | 'medium' | 'high' | 'critical') {
  switch (riskLevel) {
    case 'low':
      return {
        maxCreditsPerDay: 1000,
        maxGenerationsPerHour: 50,
        canAccessMarketplace: true,
        canPublishAgents: true,
        requiresEmailVerification: false
      };
    case 'medium':
      return {
        maxCreditsPerDay: 500,
        maxGenerationsPerHour: 20,
        canAccessMarketplace: true,
        canPublishAgents: false,
        requiresEmailVerification: true
      };
    case 'high':
      return {
        maxCreditsPerDay: 100,
        maxGenerationsPerHour: 5,
        canAccessMarketplace: false,
        canPublishAgents: false,
        requiresEmailVerification: true
      };
    case 'critical':
      return {
        maxCreditsPerDay: 0,
        maxGenerationsPerHour: 0,
        canAccessMarketplace: false,
        canPublishAgents: false,
        requiresEmailVerification: true
      };
  }
}
