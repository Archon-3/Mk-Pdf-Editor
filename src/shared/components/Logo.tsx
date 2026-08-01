import { Link } from 'react-router-dom'
import logoUrl from '../../assets/logo.svg'
import { APP_NAME } from '../constants/branding'

type LogoProps = {
  href?: string
}

export function Logo({ href = '/' }: LogoProps) {
  return (
    <Link className="brand" to={href} aria-label={`${APP_NAME} home`}>
      <img className="brand-mark" src={logoUrl} alt="" width={30} height={30} />
      <span>{APP_NAME}</span>
    </Link>
  )
}
