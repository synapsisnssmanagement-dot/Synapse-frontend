import Avatar from "./Avatar";
import cx from "@/lib/cx";

export default function Identity({ name, email, src, size = "sm", meta, className }) {
  return (
    <div className={cx("flex min-w-0 items-center gap-3", className)}>
      <Avatar src={src} name={name} size={size} />
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-fg">{name || "Unnamed"}</p>
        {email || meta ? <p className="truncate text-[12.5px] text-muted">{meta || email}</p> : null}
      </div>
    </div>
  );
}
