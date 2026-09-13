import { Link, useNavigate } from 'react-router-dom'
import { useRef, type MouseEvent } from 'react'
import logoUrl from '../../assets/logo.svg'
import { APP_NAME } from '../constants/branding'

type LogoProps = {
  href?: string
}

/** Triple-click the logo to open the hidden admin console. */
export function Logo({ href = '/' }: LogoProps) {
  const navigate = useNavigate()
  const clicks = useRef<{ count: number; timer: number | null }>({ count: 0, timer: null })

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const state = clicks.current
    state.count += 1
    if (state.timer) window.clearTimeout(state.timer)
    state.timer = window.setTimeout(() => {
      state.count = 0
      state.timer = null
    }, 700)

    if (state.count >= 3) {
      event.preventDefault()
      state.count = 0
      navigate('/admin')
    }
  }

  return (
    <Link className="brand" to={href} aria-label={`${APP_NAME} home`} onClick={handleClick}>
      <img className="brand-mark" src={logoUrl} alt="" width={30} height={30} />
      <span>{APP_NAME}</span>
    </Link>
  )
}
