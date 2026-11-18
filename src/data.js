export const NS = 'I’m not sure—help me decide'
export const opts = {
  type: ['A brand-new website', 'Redesign my existing website'],
  goals: ['More direct bookings', 'Showcase our rooms', 'Build trust in our brand', 'Sell products online', 'Share useful content'],
  pages: ['Home', 'Stay', 'Rooms', 'Local guide', 'Our story', 'Contact', 'Shop', 'Blog'],
  features: ['Booking integration', 'Availability enquiry', 'Newsletter signup', 'Online payments', 'Member area', 'Multiple languages'],
  feel: ['Warm & welcoming', 'Editorial & refined', 'Calm & minimal', 'Bold & expressive', 'Playful & colourful'],
  ready: ['Ready to share', 'Some pieces ready', 'I need help with this'],
  budget: ['£3,500–£5,000', '£5,000–£8,000', '£8,000–£12,000', '£12,000+'],
  flex: ['Fixed date', 'A little flexible · before Easter', 'Very flexible'],
}
// Demo values copied from the Figma. Replace with EMPTY for a blank client form.
export const demo = {
  name: '', email: '', phone: '', business: '', industry: '', about: '', site: '', type: '',
  goals: [], audience: '', success: '',
  pages: [], features: [], func: '', feel: [], avoid: '', ready: '', readyNote: '',
  budget: '', launch: '', flex: opts.flex[0], driver: '',
  files: [], refs: [], extra: '',
}
