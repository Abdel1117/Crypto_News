import { UserIcon, MessageIcon, RingIcon, SearchIcon } from "../Icons";
import Link from "next/link";
import { ThemeButton } from "../ThemeButton/ThemeButton";
import { ParamButton } from "../ParamButton/ParamButton";
export default function UserBar({ className = "" }: { className?: string }) {
  return (
    <div className={className || "w-full "}>
      <ul className="flex justify-end items-center gap-5">
        <li className="pr-6">
          <Link className="px-2" href="">
            <SearchIcon width={30} height={30} />
          </Link>
        </li>
        <li className="pr-6">
          <Link className="px-2" href="">
            <RingIcon width={30} height={30} />
          </Link>
        </li>
        <li className="pr-6">
          <Link className="px-2" href="">
            <MessageIcon width={30} height={30} />
          </Link>
        </li>
        <li className="pr-6">
          <Link className="px-2" href="">
            <UserIcon width={30} height={30} />
          </Link>
        </li>
        <li className="pr-6">
          <ThemeButton />
        </li>
        <li className="pr-6">
          <ParamButton />
        </li>
      </ul>
    </div>
  );
}
