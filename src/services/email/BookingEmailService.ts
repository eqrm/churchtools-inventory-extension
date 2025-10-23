/**
 * Email Reminder Service for Bookings (T128a)
 * Sends reminder emails via ChurchTools email service
 */

import type { ChurchToolsAPIClient } from '../api/ChurchToolsAPIClient'
import type { Booking } from '../../types/entities'

interface EmailReminderConfig {
  daysBeforeDue: number
  enabled: boolean
}

export class BookingEmailService {
  // @ts-expect-error - Will be used when ChurchTools email API is integrated
  private readonly _apiClient: ChurchToolsAPIClient
  private readonly config: EmailReminderConfig

  constructor(apiClient: ChurchToolsAPIClient, config: EmailReminderConfig = { daysBeforeDue: 2, enabled: true }) {
    this._apiClient = apiClient
    this.config = config
  }

  /**
   * Send reminder email for upcoming due date
   */
  async sendDueReminder(booking: Booking): Promise<void> {
    if (!this.config.enabled || !booking.asset) return

    const subject = `Erinnerung: Equipment-Rückgabe - ${booking.asset.name}`
    const body = this.formatDueReminderEmail(booking)

    await this.sendEmail(booking.requestedBy, subject, body)
  }

  /**
   * Send overdue notification email
   */
  async sendOverdueNotification(booking: Booking): Promise<void> {
    if (!this.config.enabled || !booking.asset) return

    const subject = `Überfällig: Equipment-Rückgabe - ${booking.asset.name}`
    const body = this.formatOverdueEmail(booking)

    await this.sendEmail(booking.requestedBy, subject, body)
  }

  /**
   * Send booking approval notification
   */
  async sendApprovalNotification(booking: Booking): Promise<void> {
    if (!this.config.enabled || !booking.asset) return

    const subject = `Buchung genehmigt: ${booking.asset.name}`
    const body = this.formatApprovalEmail(booking)

    await this.sendEmail(booking.requestedBy, subject, body)
  }

  /**
   * Check all active bookings and send reminders
   */
  async checkAndSendReminders(bookings: Booking[]): Promise<void> {
    const now = new Date()
    const reminderDate = new Date(now)
    reminderDate.setDate(reminderDate.getDate() + this.config.daysBeforeDue)

    for (const booking of bookings) {
      if (booking.status !== 'active') continue

      const endDate = new Date(booking.endDate)
      if (endDate <= reminderDate && endDate > now) {
        await this.sendDueReminder(booking)
      } else if (endDate < now) {
        await this.sendOverdueNotification(booking)
      }
    }
  }

  private formatDueReminderEmail(booking: Booking): string {
    if (!booking.asset) return ''
    
    return `
Hallo ${booking.requestedByName},

dies ist eine Erinnerung, dass die Rückgabe folgenden Equipments bald fällig ist:

Asset: ${booking.asset.name} (${booking.asset.assetNumber})
Zweck: ${booking.purpose}
Rückgabedatum: ${new Date(booking.endDate).toLocaleDateString('de-DE')}

Bitte geben Sie das Equipment rechtzeitig zurück.

Viele Grüße
Ihr Equipment-Management Team
    `.trim()
  }

  private formatOverdueEmail(booking: Booking): string {
    if (!booking.asset) return ''
    
    return `
Hallo ${booking.requestedByName},

die Rückgabe folgenden Equipments ist überfällig:

Asset: ${booking.asset.name} (${booking.asset.assetNumber})
Zweck: ${booking.purpose}
Fällig seit: ${new Date(booking.endDate).toLocaleDateString('de-DE')}

Bitte geben Sie das Equipment umgehend zurück.

Viele Grüße
Ihr Equipment-Management Team
    `.trim()
  }

  private formatApprovalEmail(booking: Booking): string {
    if (!booking.asset) return ''
    
    return `
Hallo ${booking.requestedByName},

Ihre Buchung wurde genehmigt:

Asset: ${booking.asset.name} (${booking.asset.assetNumber})
Zeitraum: ${new Date(booking.startDate).toLocaleDateString('de-DE')} - ${new Date(booking.endDate).toLocaleDateString('de-DE')}
Zweck: ${booking.purpose}

Sie können das Equipment ab dem Startdatum abholen.

Viele Grüße
Ihr Equipment-Management Team
    `.trim()
  }

  private async sendEmail(personId: string, subject: string, _body: string): Promise<void> {
    // TODO: Integrate with ChurchTools email service API
    // await this._apiClient.sendEmail({ to: personId, subject, body: _body })
    
    // Placeholder - log for development
    if (process.env['NODE_ENV'] === 'development') {
      console.warn(`Email reminder for person ${personId}: ${subject}`)
    }
  }
}
