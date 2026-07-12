import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Input } from '../ui/Input';
import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface TurnstileCaptchaProps {
  onTokenChange: (token: string | null) => void;
}

export function TurnstileCaptcha({ onTokenChange }: TurnstileCaptchaProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');

  const fetchCaptcha = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/register/captcha', { responseType: 'text' });
      setSvg(response.data);
      setValue('');
      onTokenChange(''); // Clear token on refresh
    } catch (err) {
      console.error('Failed to load captcha', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    onTokenChange(val);
  };

  if (loading && !svg) {
    return <div className="h-[50px] w-[150px] bg-muted animate-pulse rounded-md" />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div 
          className="bg-white rounded-md overflow-hidden border border-input shadow-sm"
          dangerouslySetInnerHTML={{ __html: svg || '' }} 
        />
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          onClick={fetchCaptcha}
          title="Refresh CAPTCHA"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        placeholder="Enter CAPTCHA"
        value={value}
        onChange={handleChange}
        autoComplete="off"
      />
    </div>
  );
}
