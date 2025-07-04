import { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import json from "../../../package.json";
// import { alertContext } from "../contexts/alertContext";
import { useToast } from "@/components/bs-ui/toast/use-toast";
import { useNavigate } from 'react-router-dom';
import { getCaptchaApi, loginApi } from "../../controllers/API/user";
import { captureAndAlertRequestErrorHoc } from "../../controllers/request";
import { handleEncrypt, handleLdapEncrypt } from './utils';
import { ldapLoginApi } from '@/controllers/API/pro';
import './loginv2.css';

export const LoginPage = () => {
    // const { setErrorData, setSuccessData } = useContext(alertContext);
    const { t, i18n } = useTranslation();
    const { message, toast } = useToast()
    const navigate = useNavigate()
    const isLoading = false

    const mailRef = useRef(null)
    const pwdRef = useRef(null)


    // captcha
    const captchaRef = useRef(null)
    const [captchaData, setCaptchaData] = useState({ captcha_key: '', user_capthca: false, captcha: '' });

    useEffect(() => {
        fetchCaptchaData();
    }, []);

    const fetchCaptchaData = () => {
        getCaptchaApi().then(setCaptchaData)
    };

    const [isLDAP, setIsLDAP] = useState(false)

    useEffect(() => {
        const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        let particlesArray: Particle[];

        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setCanvasSize();

        let mouse = { x: null as number | null, y: null as number | null, radius: (canvas.height/120) * (canvas.width/120) };

        const mouseMove = (event: MouseEvent) => {
            mouse.x = event.x;
            mouse.y = event.y;
        };
        window.addEventListener('mousemove', mouseMove);

        class Particle {
            x: number; y: number; directionX: number; directionY: number; size: number; color: string;
            constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
                this.x = x; this.y = y; this.directionX = directionX; this.directionY = directionY; this.size = size; this.color = color;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
            update() {
                if (this.x > canvas.width || this.x < 0) {
                    this.directionX = -this.directionX;
                }
                if (this.y > canvas.height || this.y < 0) {
                    this.directionY = -this.directionY;
                }
                let dx = (mouse.x ?? 0) - this.x;
                let dy = (mouse.y ?? 0) - this.y;
                let distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < mouse.radius + this.size){
                    if((mouse.x ?? 0) < this.x && this.x < canvas.width - this.size * 10) { this.x += 5; }
                    if((mouse.x ?? 0) > this.x && this.x > this.size * 10) { this.x -= 5; }
                    if((mouse.y ?? 0) < this.y && this.y < canvas.height - this.size * 10) { this.y += 5; }
                    if((mouse.y ?? 0) > this.y && this.y > this.size * 10) { this.y -= 5; }
                }
                this.x += this.directionX;
                this.y += this.directionY;
                this.draw();
            }
        }

        function init() {
            particlesArray = [];
            let numberOfParticles = (canvas.height * canvas.width) / 9000;
            for (let i = 0; i < numberOfParticles; i++) {
                let size = (Math.random() * 2) + 1;
                let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
                let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
                let directionX = (Math.random() * .4) - .2;
                let directionY = (Math.random() * .4) - .2;
                let color = 'rgba(14, 165, 233, 0.6)';
                particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
            }
        }

        function connect() {
            let opacityValue = 1;
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                                 + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                    if (distance < (canvas.width/7) * (canvas.height/7)) {
                        opacityValue = 1 - (distance/20000);
                        ctx.strokeStyle = `rgba(14, 165, 233, ${opacityValue})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        let animationId: number;
        function animate() {
            animationId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, innerWidth, innerHeight);
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
            }
            connect();
        }

        const onResize = () => {
            setCanvasSize();
            mouse.radius = (canvas.height/120) * (canvas.width/120);
            init();
        };
        window.addEventListener('resize', onResize);
        const onMouseOut = () => { mouse.x = undefined as any; mouse.y = undefined as any; };
        window.addEventListener('mouseout', onMouseOut);

        init();
        animate();
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('mouseout', onMouseOut);
        };
    }, []);
    const handleLogin = async () => {
        const error = []
        const [mail, pwd] = [mailRef.current.value, pwdRef.current.value]
        if (!mail) error.push(t('login.pleaseEnterAccount'))
        if (!pwd) error.push(t('login.pleaseEnterPassword'))
        if (captchaData.user_capthca && !captchaRef.current.value) error.push(t('login.pleaseEnterCaptcha'))
        if (error.length) return message({
            title: `${t('prompt')}`,
            variant: 'warning',
            description: error
        })
        // if (error.length) return setErrorData({
        //     title: `${t('prompt')}:`,
        //     list: error,
        // });

        const encryptPwd = isLDAP ? await handleLdapEncrypt(pwd) : await handleEncrypt(pwd)
        captureAndAlertRequestErrorHoc(
            (isLDAP
                ? ldapLoginApi(mail, encryptPwd)
                : loginApi(mail, encryptPwd, captchaData.captcha_key, captchaRef.current?.value)
            ).then((res: any) => {
                window.self === window.top ? localStorage.removeItem('ws_token') : localStorage.setItem('ws_token', res.access_token)
                localStorage.setItem('isLogin', '1')
                // const path = location.href.indexOf('from=workspace') === -1 ? '' : '/workspace'
                location.href = location.pathname === '/' ? location.origin + '/workspace/' : location.href
                // location.href = __APP_ENV__.BASE_URL + '/'

            }), (error) => {
                if (error.indexOf('过期') !== -1) { // 有时间改为 code 判断
                    localStorage.setItem('account', mail)
                    navigate('/reset', { state: { noback: true } })
                }
            })

        fetchCaptchaData()
    }


    return <div className="login-page">
        <canvas id="particle-canvas"></canvas>
        <div className="login-wrapper">
            <div className="login-container">
                <h1>E-Agent</h1>
                <p className="tagline">{t('login.slogen')}</p>
                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                    <input
                        id="email"
                        ref={mailRef}
                        placeholder={t('login.account')}
                        type="email"
                        required
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                    />
                    <input
                        id="password"
                        ref={pwdRef}
                        placeholder={t('login.password')}
                        type="password"
                        required
                    />
                    {
                        captchaData.user_capthca && (
                            <div className="captcha-group">
                                <input
                                    type="text"
                                    ref={captchaRef}
                                    placeholder={t('login.pleaseEnterCaptcha')}
                                />
                                <img
                                    src={'data:image/jpg;base64,' + captchaData.captcha}
                                    alt="captcha"
                                    onClick={fetchCaptchaData}
                                />
                            </div>
                        )
                    }
                    <button type="submit" className='login-submit-button' disabled={isLoading}>
                        {t('login.loginButton')}
                    </button>
                </form>
                <div className="footer">
                    <p>© 杭州唐数人工智能科技有限公司</p>
                </div>
            </div>
        </div>
        <span className="version">v{json.version}</span>
    </div>
};
