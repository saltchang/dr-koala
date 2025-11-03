import { memo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UserAgreementDialogProps {
  open: boolean;
  onConfirm: () => void;
}

function UserAgreementDialog({ open, onConfirm }: UserAgreementDialogProps) {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const threshold = 10;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
    setIsScrolledToBottom(isAtBottom);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="max-w-2xl h-[80vh] flex flex-col gap-0 p-0">
        <div className="px-6 pt-6 pb-4 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Terms of Service and Cookie Usage Agreement</DialogTitle>
            <DialogTitle className="text-xl">服務條款與 Cookie 使用協議</DialogTitle>
          </DialogHeader>
        </div>

        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 pb-4 space-y-4 text-sm min-h-0"
        >
          <div className="space-y-3">
            <h3 className="font-semibold text-base">English</h3>

            <p>
              Please read the following terms carefully before using Dr. Koala. By clicking "Agree and Continue," you
              acknowledge that you have read, understood, and agree to be bound by these terms.
            </p>

            <div className="space-y-2">
              <div>
                <strong>1. Demonstration Platform Notice</strong>
                <p className="mt-1 text-muted-foreground">
                  Dr. Koala is a demonstration platform. All data submitted and generated on this website may be visible
                  to other users. This platform is designed for demonstration purposes only and does not provide data
                  privacy guarantees.
                </p>
              </div>

              <div>
                <strong>2. Prohibited Use and Limitations</strong>
                <p className="mt-1 text-muted-foreground">
                  This website is intended solely for demonstration and evaluation purposes. Users are prohibited from
                  abusing the service, including but not limited to: excessive requests, automated scraping, or any
                  activity that may negatively impact service availability. Please use this platform responsibly and
                  only for its intended demonstration features.
                </p>
              </div>

              <div>
                <strong>3. Content Restrictions</strong>
                <p className="mt-1 text-muted-foreground">
                  Users must not submit any personal information, sensitive data, confidential information, or any
                  content that is illegal, harmful, threatening, abusive, or otherwise objectionable. This platform
                  should only be used for lawful and appropriate purposes. Any violation may result in immediate
                  termination of access.
                </p>
              </div>

              <div>
                <strong>4. Data Collection and Cookies</strong>
                <p className="mt-1 text-muted-foreground">
                  This website utilizes cookies and similar technologies to store user preferences and enhance user
                  experience. By using this service, you consent to our collection, storage, and processing of your
                  information through cookies in accordance with applicable laws.
                </p>
              </div>

              <div>
                <strong>5. Acceptance of Terms</strong>
                <p className="mt-1 text-muted-foreground">
                  By continuing to use Dr. Koala, you acknowledge and agree to all terms and conditions set forth
                  herein. You consent to our data collection practices and cookie usage policy. If you do not agree with
                  these terms, please do not use this service.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-base">繁體中文（台灣）</h3>

            <p>
              在使用 Dr. Koala 之前，請仔細閱讀以下條款。點擊「同意並繼續」即表示您已閱讀、理解並同意受這些條款約束。
            </p>

            <div className="space-y-2">
              <div>
                <strong>1. 展示平台聲明</strong>
                <p className="mt-1 text-muted-foreground">
                  Dr. Koala 是一個展示平台。所有在本網站上提交和產生的資料可能對其他使用者可見。
                  本平台僅供展示目的，不提供資料隱私保障。
                </p>
              </div>

              <div>
                <strong>2. 禁止濫用與使用限制</strong>
                <p className="mt-1 text-muted-foreground">
                  本網站僅供展示和評估目的使用。使用者禁止濫用本服務，包括但不限於：過度請求、
                  自動化爬蟲或任何可能對服務可用性造成負面影響的行為。請負責任地使用本平台， 僅用於其預期的展示功能。
                </p>
              </div>

              <div>
                <strong>3. 內容限制</strong>
                <p className="mt-1 text-muted-foreground">
                  使用者不得提交任何個人資訊、敏感資料、機密資訊，或任何非法、有害、威脅、濫用或
                  其他令人反感的內容。本平台僅應用於合法且適當的目的。任何違規行為可能導致立即終止存取權限。
                </p>
              </div>

              <div>
                <strong>4. 資料收集與 Cookie</strong>
                <p className="mt-1 text-muted-foreground">
                  本網站使用 Cookie 和類似技術來儲存使用者偏好設定並增強使用者體驗。
                  使用本服務即表示您同意我們依據適用法律，透過 Cookie 收集、儲存和處理您的資訊。
                </p>
              </div>

              <div>
                <strong>5. 接受條款</strong>
                <p className="mt-1 text-muted-foreground">
                  繼續使用 Dr. Koala 即表示您認可並同意本協議所載的所有條款和條件。 您同意我們的資料收集實務和 Cookie
                  使用政策。如果您不同意這些條款，請勿使用本服務。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t bg-background px-6 py-4">
          <DialogFooter className="sm:justify-center">
            <Button onClick={onConfirm} disabled={!isScrolledToBottom} className="w-full sm:w-auto min-w-[200px]">
              {isScrolledToBottom
                ? 'Agree and Continue / 同意並繼續'
                : 'Please read the terms carefully / 請仔細閱讀條款'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(UserAgreementDialog);
