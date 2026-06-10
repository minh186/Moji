import { Heart, Loader2, RotateCcw } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/useUserStore";

// ─── Giới hạn ký tự ──────────────────────────────────────────────────────────
const MAX_DISPLAY_NAME = 50;
const MAX_BIO = 500;

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormValues {
  displayName: string;
  phone: string;
  bio: string;
}

interface FormErrors {
  displayName?: string;
  phone?: string;
  bio?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = {
  userInfo: User | null;
};

// ─── Component ───────────────────────────────────────────────────────────────
const PersonalInfoForm = ({ userInfo }: Props) => {
  const { updateProfile } = useUserStore();
  const [isSaving, setIsSaving] = useState(false);

  // ── Form state ────────────────────────────────────────────────────────────
  const getInitialValues = (user: User): FormValues => ({
    displayName: user.displayName ?? "",
    phone: user.phone ?? "",
    bio: user.bio ?? "",
  });

  const [values, setValues] = useState<FormValues>(() =>
    userInfo
      ? getInitialValues(userInfo)
      : { displayName: "", phone: "", bio: "" },
  );

  // Đồng bộ form khi userInfo thay đổi từ bên ngoài (ví dụ sau khi socket cập nhật)
  useEffect(() => {
    if (userInfo) {
      setValues(getInitialValues(userInfo));
    }
  }, [userInfo?._id]); // Chỉ reset khi đổi user, không reset khi đang edit

  const [errors, setErrors] = useState<FormErrors>({});

  // ── Dirty check: chỉ enable nút khi có thay đổi thực sự ──────────────────
  const isDirty = userInfo
    ? values.displayName !== (userInfo.displayName ?? "") ||
      values.phone !== (userInfo.phone ?? "") ||
      values.bio !== (userInfo.bio ?? "")
    : false;

  // ── Field change handler ──────────────────────────────────────────────────
  const handleChange = (field: keyof FormValues, val: string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
    // Xoá lỗi của field này khi user bắt đầu sửa
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ── Reset về giá trị gốc ─────────────────────────────────────────────────
  const handleReset = () => {
    if (userInfo) setValues(getInitialValues(userInfo));
    setErrors({});
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!values.displayName.trim()) {
      newErrors.displayName = "Tên hiển thị là bắt buộc";
    } else if (values.displayName.trim().length > MAX_DISPLAY_NAME) {
      newErrors.displayName = `Tối đa ${MAX_DISPLAY_NAME} ký tự`;
    }

    if (values.bio.length > MAX_BIO) {
      newErrors.bio = `Tối đa ${MAX_BIO} ký tự`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await updateProfile({
        displayName: values.displayName.trim(),
        bio: values.bio.trim(),
        phone: values.phone.trim(),
      });
      // Không cần reset vì useEffect sẽ đồng bộ khi userInfo thay đổi qua setUser
    } catch {
      // Lỗi đã được toast bên trong useUserStore, không cần làm gì thêm
    } finally {
      setIsSaving(false);
    }
  };

  if (!userInfo) return null;

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>
        <CardDescription>
          Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tên hiển thị — editable */}
          <div className="space-y-1">
            <Label htmlFor="displayName">
              Tên hiển thị
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="displayName"
              type="text"
              value={values.displayName}
              onChange={(e) => handleChange("displayName", e.target.value)}
              maxLength={MAX_DISPLAY_NAME + 5} // cho phép nhập dư để hiện lỗi
              className="glass-light border-border/30"
              disabled={isSaving}
            />
            <div className="flex justify-between items-center min-h-[16px]">
              {errors.displayName ? (
                <p className="text-xs text-destructive">{errors.displayName}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {values.displayName.length}/{MAX_DISPLAY_NAME}
              </span>
            </div>
          </div>

          {/* Tên người dùng — read-only (định danh tài khoản) */}
          <div className="space-y-1">
            <Label
              htmlFor="username"
              className="text-muted-foreground flex items-center gap-1.5"
            >
              Tên người dùng
              <span className="text-xs font-normal whitespace-nowrap">
                (không thể sửa)
              </span>
            </Label>
            <Input
              id="username"
              type="text"
              value={userInfo.username}
              readOnly
              disabled
              className="glass-light border-border/30 opacity-50 cursor-not-allowed"
              title="Tên người dùng không thể thay đổi"
            />
          </div>

          {/* Email — read-only (định danh tài khoản) */}
          <div className="space-y-1">
            <Label
              htmlFor="email"
              className="text-muted-foreground flex items-center gap-1.5"
            >
              Email
              <span className="text-xs font-normal whitespace-nowrap">
                (không thể sửa)
              </span>
            </Label>
            <Input
              id="email"
              type="email"
              value={userInfo.email}
              readOnly
              disabled
              className="glass-light border-border/30 opacity-50 cursor-not-allowed"
              title="Email không thể thay đổi"
            />
          </div>

          {/* Số điện thoại — editable */}
          <div className="space-y-1">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              value={values.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="glass-light border-border/30"
              placeholder="Chưa cập nhật"
              disabled={isSaving}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Giới thiệu — editable */}
        <div className="space-y-1">
          <Label htmlFor="bio">Giới thiệu</Label>
          <Textarea
            id="bio"
            rows={3}
            value={values.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            className="glass-light border-border/30 resize-none"
            placeholder="Giới thiệu bản thân..."
            disabled={isSaving}
          />
          <div className="flex justify-between items-center min-h-[16px]">
            {errors.bio ? (
              <p className="text-xs text-destructive">{errors.bio}</p>
            ) : (
              <span />
            )}
            <span
              className={`text-xs ml-auto ${
                values.bio.length > MAX_BIO
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {values.bio.length}/{MAX_BIO}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            onClick={handleSubmit}
            disabled={!isDirty || isSaving}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>

          {/* Nút reset chỉ hiện khi có thay đổi */}
          {isDirty && !isSaving && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground"
              title="Huỷ thay đổi"
            >
              <RotateCcw className="size-4 mr-2" />
              Huỷ
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
