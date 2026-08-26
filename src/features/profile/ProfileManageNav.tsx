import { Link } from "react-router-dom";
import {
  BriefcaseIcon,
  CameraIcon,
  ChatIcon,
  EyeIcon,
  HeartIcon,
  LightbulbIcon,
  ShieldCheckIcon,
  SparkleIcon,
  UserIcon,
  WineIcon,
} from "../shell/icons.tsx";
import { EDIT_SECTIONS, type EditSectionId } from "./edit/sections.ts";

const NAV_ICONS: Record<EditSectionId, typeof UserIcon> = {
  about: UserIcon,
  photos: CameraIcon,
  work: BriefcaseIcon,
  lifestyle: WineIcon,
  dating: HeartIcon,
  interests: SparkleIcon,
  languages: ChatIcon,
  prompts: LightbulbIcon,
  verification: ShieldCheckIcon,
  preview: EyeIcon,
};

type Props = {
  current: "preview" | EditSectionId;
};

export function ProfileManageNav({ current }: Props) {
  return (
    <nav className="edit-profile__nav-list" aria-label="Profile sections">
      {EDIT_SECTIONS.map((section) => {
        const Icon = NAV_ICONS[section.id];
        const to = section.id === "preview" ? "/profile" : `/profile/edit#${section.id}`;
        const active = section.id === "preview" ? current === "preview" : current === section.id;
        return (
          <Link key={section.id} to={to} className={active ? "is-active" : undefined}>
            <Icon />
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
