/**
 * Format a number as Vietnamese currency (VNĐ)
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 đ'
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
}

/**
 * Format a date string to Vietnamese locale
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * Format month/year for display
 */
export const formatMonthYear = (month, year) => {
  return `Tháng ${month}/${year}`
}

/**
 * Get current month and year
 */
export const getCurrentMonthYear = () => {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

/**
 * Get previous month's info (for billing)
 */
export const getPreviousMonth = (month, year) => {
  if (month === 1) return { month: 12, year: year - 1 }
  return { month: month - 1, year }
}

/**
 * Combine class names utility
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

/**
 * Debounce utility
 */
export const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Generate a list of months for a dropdown
 */
export const getMonthOptions = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }))
}

/**
 * Generate a list of years for a dropdown
 */
export const getYearOptions = (range = 3) => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: range * 2 + 1 }, (_, i) => ({
    value: currentYear - range + i,
    label: `${currentYear - range + i}`,
  }))
}

/**
 * Parse number from string safely
 */
export const parseNumber = (val) => {
  const n = parseFloat(String(val).replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

/**
 * Truncate long strings
 */
export const truncate = (str, maxLen = 30) => {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}
