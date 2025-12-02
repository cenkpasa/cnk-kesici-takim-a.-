
import { DocumentTemplate } from "../types";

export const documentTemplates: DocumentTemplate[] = [
    {
        id: "ihbar_sureli_fesih",
        title: "İhbar Süreli Fesih Bildirimi (4857/17)",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            
            <h3 style="text-align: center; text-decoration: underline; margin-bottom: 20px;">İŞ SÖZLEŞMESİ FESİH BİLDİRİMİ (İHBAR SÜRELİ)</h3>

            <p><strong>Sayın {{AD_SOYAD}},</strong></p>
            
            <p>Şirketimizde sürdürmekte olduğunuz iş sözleşmeniz, <strong>{{FESIH_NEDENI}}</strong> gerekçesiyle, 4857 Sayılı İş Kanunu'nun 17. maddesi uyarınca yasal bildirim sürelerine uyularak feshedilecektir.</p>
            
            <p>Kıdem sürenize istinaden hesaplanan <strong>{{IHBAR_SURESI}} hafta</strong> ihbar öneliniz bulunmaktadır.</p>
            
            <ul>
                <li>İhbar süreniz <strong>{{IHBAR_BASLANGIC}}</strong> tarihinde başlayacak ve <strong>{{IHBAR_BITIS}}</strong> tarihinde sona erecektir.</li>
                <li>Bu süre zarfında her gün iş saatleri içerisinde <strong>2 (iki) saat</strong> yeni iş arama izniniz bulunmaktadır. Bu izinleri birleştirerek toplu olarak kullanmak isterseniz yazılı talebinizi iletmenizi rica ederiz.</li>
            </ul>
            
            <p>İş sözleşmenizin sona ereceği {{IHBAR_BITIS}} tarihine kadar tüm kanuni haklarınız (kıdem tazminatı, kullanılmamış yıllık izin ücretleri vb.) hesaplanarak banka hesabınıza yatırılacaktır.</p>
            
            <p>Bilgilerinizi ve gereğini rica ederiz.</p>
            
            {{FOOTER}}
        `,
        dynamicFields: [
            { key: "FESIH_NEDENI", label: "Fesih Nedeni (Performans, İş Azlığı vb.)", type: "textarea", placeholder: "Örn: Şirketimizin ekonomik sebeplerle daralmaya gitmesi..." },
            { key: "IHBAR_SURESI", label: "İhbar Süresi (Hafta)", type: "number" },
            { key: "IHBAR_BASLANGIC", label: "İhbar Başlangıç Tarihi", type: "date" },
            { key: "IHBAR_BITIS", label: "İhbar Bitiş (Çıkış) Tarihi", type: "date" }
        ]
    },
    {
        id: "ihbar_suresiz_fesih",
        title: "Derhal Fesih Bildirimi (4857/25-II)",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            
            <h3 style="text-align: center; text-decoration: underline; margin-bottom: 20px;">İŞ SÖZLEŞMESİ DERHAL FESİH BİLDİRİMİ</h3>
            
            <p><strong>Sayın {{AD_SOYAD}},</strong></p>
            
            <p>Şirketimizde <strong>{{OLAY_TARIHI}}</strong> tarihinde tespit edilen aşağıdaki eyleminiz/davranışınız nedeniyle:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid red; margin: 15px 0;">
                <em>"{{FESIH_GEREKCESI}}"</em>
            </div>
            
            <p>Söz konusu eyleminiz, 4857 Sayılı İş Kanunu'nun <strong>25/II maddesinde</strong> belirtilen <em>"Ahlak ve iyi niyet kurallarına uymayan haller ve benzerleri"</em> kapsamında değerlendirilmiştir.</p>
            
            <p>Bu nedenle iş sözleşmeniz, <strong>{{CIKIS_TARIHI}}</strong> tarihi itibariyle, bildirim süresi beklenmeksizin ve tazminatsız olarak <strong>DERHAL</strong> feshedilmiştir.</p>
            
            <p>Yasal haklarımız saklı kalmak kaydıyla bilgilerinize sunarız.</p>
            
            {{FOOTER}}
        `,
        dynamicFields: [
            { key: "OLAY_TARIHI", label: "Olay Tarihi", type: "date" },
            { key: "FESIH_GEREKCESI", label: "Fesih Gerekçesi (Madde 25/II kapsamı)", type: "textarea", placeholder: "Örn: 3 iş günü ardı ardına mazeretsiz devamsızlık yapmanız..." },
            { key: "CIKIS_TARIHI", label: "Fesih (Çıkış) Tarihi", type: "date" }
        ]
    },
    {
        id: "disiplin_tutanagi",
        title: "Disiplin Olay Tutanağı",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            
            <h3 style="text-align: center; text-decoration: underline; margin-bottom: 20px;">OLAY TESPİT TUTANAĞI</h3>
            
            <p>İşyerimizde <strong>{{OLAY_TARIHI}}</strong> tarihinde, saat <strong>{{OLAY_SAATI}}</strong> sularında aşağıdaki olay meydana gelmiştir:</p>
            
            <div style="border: 1px solid #000; padding: 15px; min-height: 100px;">
                <p><strong>OLAYIN OLUŞ ŞEKLİ:</strong></p>
                <p>{{OLAY_ACIKLAMASI}}</p>
            </div>
            <br/>
            
            <p>Yukarıda belirtilen olay, işyeri düzenini ve çalışma barışını bozucu nitelikte olup, aşağıda imzası bulunan şahitler huzurunda işbu tutanak imza altına alınmıştır.</p>
            
            <table style="width: 100%; margin-top: 40px; border-collapse: collapse;">
                <tr>
                    <td style="width: 33%; text-align: center; vertical-align: top;">
                        <p><strong>Tutanak Düzenleyen</strong></p>
                        <p>CENK DİKMEN</p>
                        <br/><br/>
                        <p>İmza: .......................</p>
                    </td>
                    <td style="width: 33%; text-align: center; vertical-align: top;">
                        <p><strong>Şahit 1</strong></p>
                        <p>{{SAHIT_1}}</p>
                        <br/><br/>
                        <p>İmza: .......................</p>
                    </td>
                    <td style="width: 33%; text-align: center; vertical-align: top;">
                        <p><strong>Şahit 2</strong></p>
                        <p>{{SAHIT_2}}</p>
                        <br/><br/>
                        <p>İmza: .......................</p>
                    </td>
                </tr>
            </table>
        `,
        dynamicFields: [
            { key: "OLAY_TARIHI", label: "Olay Tarihi", type: "date" },
            { key: "OLAY_SAATI", label: "Olay Saati", type: "text", placeholder: "14:30" },
            { key: "OLAY_ACIKLAMASI", label: "Olayın Detaylı Açıklaması", type: "textarea" },
            { key: "SAHIT_1", label: "Şahit 1 Adı Soyadı", type: "text" },
            { key: "SAHIT_2", label: "Şahit 2 Adı Soyadı", type: "text" }
        ]
    },
    {
        id: "savunma_istemi",
        title: "Savunma İstem Yazısı",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            
            <h3 style="text-align: center; text-decoration: underline; margin-bottom: 20px;">SAVUNMA İSTEM YAZISI</h3>
            
            <p><strong>Sayın {{AD_SOYAD}},</strong></p>
            
            <p>Hakkınızda tutulan <strong>{{TUTANAK_TARIHI}}</strong> tarihli tutanakta/rapor da belirtildiği üzere;</p>
            
            <div style="background-color: #f0f0f0; padding: 15px; margin: 15px 0; font-style: italic;">
                "{{OLAY_OZETI}}"
            </div>
            
            <p>şeklindeki davranışınız/eyleminiz tespit edilmiştir.</p>
            
            <p>4857 Sayılı İş Kanunu'nun 19. maddesi gereğince, söz konusu iddialara karşı savunmanızı, işbu yazının tarafınıza tebliğinden itibaren <strong>2 (iki) iş günü</strong> içerisinde yazılı olarak vermenizi rica ederiz.</p>
            
            <p>Belirtilen süre içinde savunmanızı vermemeniz halinde, savunma hakkınızdan feragat etmiş sayılacağınızı ve mevcut bilgi/belgelere göre disiplin işlemi uygulanacağını ihtaren bildiririz.</p>
            
            {{FOOTER}}
        `,
        dynamicFields: [
            { key: "TUTANAK_TARIHI", label: "İlgili Tutanak Tarihi", type: "date" },
            { key: "OLAY_OZETI", label: "Olay/İddia Özeti", type: "textarea", placeholder: "Örn: 12.02.2025 tarihinde mesai saatleri içinde..." }
        ]
    },
    {
        id: "personel_uyari",
        title: "Personel Uyarı Formu (Yazılı İkaz)",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            
            <h3 style="text-align: center; text-decoration: underline; margin-bottom: 20px;">PERSONEL UYARI FORMU</h3>
            
            <p><strong>Sayın {{AD_SOYAD}},</strong></p>
            
            <p>Aşağıda belirtilen konu/olay nedeniyle şirketimiz disiplin kurallarına aykırı hareket ettiğiniz tespit edilmiştir.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="border: 1px solid #ccc; padding: 10px; background-color: #eee; font-weight: bold; width: 30%;">Uyarı Konusu:</td>
                    <td style="border: 1px solid #ccc; padding: 10px;">{{UYARI_KONUSU}}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ccc; padding: 10px; background-color: #eee; font-weight: bold;">Tespit Tarihi:</td>
                    <td style="border: 1px solid #ccc; padding: 10px;">{{TESPIT_TARIHI}}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ccc; padding: 10px; background-color: #eee; font-weight: bold;">Açıklama:</td>
                    <td style="border: 1px solid #ccc; padding: 10px;">{{ACIKLAMA}}</td>
                </tr>
            </table>
            
            <p>Bu davranışınızın tekrarı halinde, İş Kanunu'nun ilgili maddeleri uyarınca iş sözleşmenizin feshi dahil olmak üzere daha ağır disiplin cezalarının uygulanacağı hususunda bilgilerinizi ve dikkatinizi rica ederim.</p>
            
            <p>Bu yazı bir <strong>YAZILI UYARI (İKAZ)</strong> niteliğindedir.</p>
            
            {{FOOTER}}
        `,
        dynamicFields: [
            { key: "UYARI_KONUSU", label: "Uyarı Konusu", type: "text" },
            { key: "TESPIT_TARIHI", label: "Tespit Tarihi", type: "date" },
            { key: "ACIKLAMA", label: "Olay Açıklaması", type: "textarea" }
        ]
    },
    {
        id: "noter_ihtarnamesi",
        title: "Noter İhtarnamesi Taslağı",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            
            <h3 style="text-align: center; text-decoration: underline; margin-bottom: 20px;">İHTARNAME</h3>
            
            <p><strong>KEŞİDE EDEN (İŞVEREN):</strong> CNK Kesici Takımlar San. ve Tic. Ltd. Şti.<br>
            Adres: İvedik OSB Proted Park İş Merkezi No:151 Yenimahalle/ANKARA</p>
            
            <p><strong>MUHATAP (İŞÇİ):</strong> {{AD_SOYAD}}<br>
            TC Kimlik No: {{TC_NO}}<br>
            Adres: {{ADRES}}</p>
            
            <p><strong>KONU:</strong> İş sözleşmesinin haklı nedenle feshi ve devamsızlık hk.</p>
            
            <p><strong>AÇIKLAMALAR:</strong></p>
            
            <p>Sayın Muhatap,</p>
            
            <p>Şirketimizde sürdürmekte olduğunuz görevinize, <strong>{{DEVAMSIZLIK_TARIHLERI}}</strong> tarihlerinde herhangi bir mazeret bildirmeksizin ve izin almaksızın gelmediğiniz tespit edilmiştir.</p>
            
            <p>Bu durum İş Kanunu'nun 25/II-g maddesi uyarınca <em>"İşçinin işverenden izin almaksızın veya haklı bir sebebe dayanmaksızın ardı ardına iki işgünü veya bir ay içinde iki defa herhangi bir tatil gününden sonraki iş günü, yahut bir ayda üç işgünü işine devam etmemesi"</em> kapsamında haklı fesih sebebidir.</p>
            
            <p>İşbu ihtarnamenin tarafınıza tebliğinden itibaren <strong>3 (üç) gün</strong> içinde, işe gelmeme gerekçenizi ispatlayan resmi belgeleri (rapor vb.) işyerimize ibraz etmenizi, aksi takdirde iş sözleşmenizin 4857 sayılı yasanın 25/II-g bendi uyarınca haklı nedenle tazminatsız olarak feshedileceğini ihtar ederiz.</p>
            
            <p><strong>SAYIN NOTER;</strong></p>
            <p>Üç nüshadan ibaret işbu ihtarnamenin bir nüşasının muhataba tebliğini, bir nüshasının dairenizde saklanmasını, tebliğ şerhini havi bir nüshasının da tarafımıza verilmesini rica ederiz.</p>
            
            {{FOOTER}}
        `,
        dynamicFields: [
            { key: "ADRES", label: "Personel Ev Adresi", type: "textarea" },
            { key: "DEVAMSIZLIK_TARIHLERI", label: "Devamsızlık Tarihleri", type: "text", placeholder: "Örn: 10, 11 ve 12 Ocak 2025" }
        ]
    },
    {
        id: "sgk_cikis_listesi",
        title: "SGK Çıkış İşlemleri Listesi",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            
            <h3 style="text-align: center; text-decoration: underline; margin-bottom: 20px;">İŞTEN ÇIKIŞ KONTROL LİSTESİ</h3>
            
            <p>Aşağıdaki işlemler <strong>{{CIKIS_TARIHI}}</strong> tarihinde işten ayrılan personelin çıkış sürecinde kontrol edilmiştir.</p>
            
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                <tr style="background-color: #ccc;">
                    <th style="border: 1px solid #000; padding: 8px; width: 10%;">Durum</th>
                    <th style="border: 1px solid #000; padding: 8px;">İşlem Adı</th>
                    <th style="border: 1px solid #000; padding: 8px; width: 20%;">Sorumlu</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; text-align: center;">[ ]</td>
                    <td style="border: 1px solid #000; padding: 8px;">İstifa Dilekçesi / Fesih Bildirimi İmzalandı mı?</td>
                    <td style="border: 1px solid #000; padding: 8px;">İK</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; text-align: center;">[ ]</td>
                    <td style="border: 1px solid #000; padding: 8px;">Zimmetli Eşyalar (Bilgisayar, Telefon, Araç vb.) Teslim Alındı mı?</td>
                    <td style="border: 1px solid #000; padding: 8px;">İdari İşler</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; text-align: center;">[ ]</td>
                    <td style="border: 1px solid #000; padding: 8px;">Şirket Hattı / E-Posta Hesabı Kapatıldı mı?</td>
                    <td style="border: 1px solid #000; padding: 8px;">IT</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; text-align: center;">[ ]</td>
                    <td style="border: 1px solid #000; padding: 8px;">SGK İşten Ayrılış Bildirgesi (10 Gün İçinde) Verildi mi?</td>
                    <td style="border: 1px solid #000; padding: 8px;">Muhasebe</td>
                </tr>
                 <tr>
                    <td style="border: 1px solid #000; text-align: center;">[ ]</td>
                    <td style="border: 1px solid #000; padding: 8px;">Kıdem / İhbar Tazminatı Hesaplandı ve Ödendi mi?</td>
                    <td style="border: 1px solid #000; padding: 8px;">Muhasebe</td>
                </tr>
                 <tr>
                    <td style="border: 1px solid #000; text-align: center;">[ ]</td>
                    <td style="border: 1px solid #000; padding: 8px;">İbraname İmzalandı mı?</td>
                    <td style="border: 1px solid #000; padding: 8px;">İK</td>
                </tr>
                 <tr>
                    <td style="border: 1px solid #000; text-align: center;">[ ]</td>
                    <td style="border: 1px solid #000; padding: 8px;">Çalışma Belgesi Teslim Edildi mi?</td>
                    <td style="border: 1px solid #000; padding: 8px;">İK</td>
                </tr>
            </table>
            
            <br/><br/>
            <div style="float: right;">
                <p><strong>Kontrol Eden:</strong> CENK DİKMEN</p>
                <p><strong>Tarih:</strong> {{TARIH}}</p>
                <p><strong>İmza:</strong> ..........................</p>
            </div>
        `,
        dynamicFields: [
            { key: "CIKIS_TARIHI", label: "Çıkış Tarihi", type: "date" },
            { key: "TARIH", label: "Kontrol Tarihi", type: "date" }
        ]
    },
     {
        id: "zimmet_tutanagi",
        title: "Genel Demirbaş Zimmet Tutanağı",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            <h2 style="text-align: center;">DEMİRBAŞ ZİMMET TESLİM TUTANAĞI</h2>
            <br/>
            <p>Aşağıda özellikleri belirtilen şirket demirbaşları, işyeri kullanımı amacıyla sağlam ve çalışır vaziyette teslim edilmiştir.</p>
            <br/>
            <table style="width: 100%; border: 1px solid black; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid black; padding: 10px; width: 10%;">Sıra</th>
                        <th style="border: 1px solid black; padding: 10px;">Malzeme / Eşya Detayları (Marka, Model, Seri No)</th>
                    </tr>
                </thead>
                <tbody>
                    {{ZIMMET_ROWS}}
                </tbody>
            </table>
            <br/>
            <p>Personel, kendisine teslim edilen demirbaşları iş amacı dışında kullanmayacağını, gereken özeni göstereceğini, işten ayrılırken eksiksiz ve hasarsız olarak iade edeceğini taahhüt eder.</p>
            {{FOOTER}}
        `,
        dynamicFields: [
            { key: "ESYALAR", label: "Zimmetlenen Eşyalar (Her satıra bir eşya yazınız)", type: "textarea", placeholder: "Örn:\nMasa\nSandalye\nTakım Çantası" }
        ]
    },
    {
        id: "arac_zimmet",
        title: "Araç Zimmet Tutanağı",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            <h3 style="text-align: center; text-decoration: underline;">ARAÇ ZİMMET VE TESLİM TUTANAĞI</h3>
            <br/>
            <p>Şirketimize ait aşağıda özellikleri belirtilen araç, iş süreçlerinde kullanılmak üzere personele hasarsız ve çalışır vaziyette teslim edilmiştir.</p>
            <br/>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                <tr>
                    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; width: 30%; font-weight: bold;">Araç Plakası</td>
                    <td style="border: 1px solid #000; padding: 10px;"><strong>{{ARAC_PLAKA}}</strong></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold;">Marka / Model</td>
                    <td style="border: 1px solid #000; padding: 10px;">{{ARAC_MARKA}} / {{ARAC_MODEL}}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold;">Teslim Kilometresi</td>
                    <td style="border: 1px solid #000; padding: 10px;">{{TESLIM_KM}} km</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold;">Yakıt Durumu</td>
                    <td style="border: 1px solid #000; padding: 10px;">{{YAKIT_DURUMU}}</td>
                </tr>
                 <tr>
                    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold;">Teslim Edilenler</td>
                    <td style="border: 1px solid #000; padding: 10px;">[x] Ruhsat  [x] Kontak Anahtarı  {{AKSESUAR}}</td>
                </tr>
            </table>
            <br/>
            <h4 style="text-decoration: underline;">Zimmet Şartları:</h4>
            <ol>
                <li>Aracı trafik kurallarına uygun kullanacağımı, doğacak trafik cezalarını şahsen ödeyeceğimi,</li>
                <li>Aracı sadece şirket işleri için kullanacağımı, üçüncü şahıslara kullandırmayacağımı,</li>
                <li>İş sözleşmemin sona ermesi veya talep halinde aracı derhal iade edeceğimi kabul ederim.</li>
            </ol>
            {{FOOTER}}
        `,
        dynamicFields: [
            { key: "ARAC_PLAKA", label: "Araç Plakası", type: "text" },
            { key: "ARAC_MARKA", label: "Marka", type: "text" },
            { key: "ARAC_MODEL", label: "Model Yılı/Tipi", type: "text" },
            { key: "TESLIM_KM", label: "Teslim Anındaki KM", type: "number" },
            { key: "YAKIT_DURUMU", label: "Yakıt Seviyesi", type: "text" },
            { key: "AKSESUAR", label: "Ek Teslim Edilenler", type: "text" }
        ]
    },
     {
        id: "yillik_izin",
        title: "Yıllık İzin Formu",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            <h3 style="text-align: center; text-decoration: underline;">YILLIK ÜCRETLİ İZİN FORMU</h3>
            <br/>
            <p>4857 sayılı İş Kanunu kapsamında hak etmiş olduğum yıllık ücretli izin hakkımı aşağıda belirttiğim tarihler arasında kullanmak istiyorum.</p>
            <br/>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                <tr>
                    <td style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold;">İzin Başlangıç Tarihi</td>
                    <td style="border: 1px solid #000; padding: 8px;">{{BASLANGIC_TARIHI}}</td>
                    <td style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold;">İşe Başlama Tarihi</td>
                    <td style="border: 1px solid #000; padding: 8px;">{{ISE_BASLAMA_TARIHI}}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold;">Kullanılacak Gün</td>
                    <td style="border: 1px solid #000; padding: 8px;" colspan="3">{{GUN_SAYISI}} Gün</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold;">İzindeki Adres / Tel</td>
                    <td style="border: 1px solid #000; padding: 8px;" colspan="3">{{IZIN_ADRESI}}</td>
                </tr>
            </table>
            {{FOOTER}}
        `,
        dynamicFields: [
            { key: "BASLANGIC_TARIHI", label: "İzin Başlangıç Tarihi", type: "date" },
            { key: "ISE_BASLAMA_TARIHI", label: "İşe Başlama Tarihi (Dönüş)", type: "date" },
            { key: "GUN_SAYISI", label: "Gün Sayısı", type: "number" },
            { key: "IZIN_ADRESI", label: "İzindeki Adres/Tel", type: "text" }
        ]
    },
    {
        id: "ozluk_kapagi",
        title: "Personel Özlük Dosyası Kapağı",
        content: `
            {{HEADER}}
            
            <br/><br/>
            
            <div style="border: 3px solid #000; padding: 40px; text-align: center; min-height: 600px; position: relative;">
                
                <h1 style="font-size: 36px; margin-bottom: 60px; text-decoration: underline;">PERSONEL ÖZLÜK DOSYASI</h1>
                
                <table style="width: 100%; font-size: 18px; line-height: 2;">
                    <tr>
                        <td style="text-align: left; font-weight: bold; width: 40%;">ADI SOYADI</td>
                        <td style="text-align: left;">: {{AD_SOYAD}}</td>
                    </tr>
                    <tr>
                        <td style="text-align: left; font-weight: bold;">T.C. KİMLİK NO</td>
                        <td style="text-align: left;">: {{TC_NO}}</td>
                    </tr>
                    <tr>
                        <td style="text-align: left; font-weight: bold;">SİCİL NUMARASI</td>
                        <td style="text-align: left;">: {{SICIL_NO}}</td>
                    </tr>
                    <tr>
                        <td style="text-align: left; font-weight: bold;">GÖREVİ</td>
                        <td style="text-align: left;">: {{GOREVI}}</td>
                    </tr>
                    <tr>
                        <td style="text-align: left; font-weight: bold;">İŞE GİRİŞ TARİHİ</td>
                        <td style="text-align: left;">: {{ISE_GIRIS_TARIHI}}</td>
                    </tr>
                     <tr>
                        <td style="text-align: left; font-weight: bold;">KAN GRUBU</td>
                        <td style="text-align: left;">: {{KAN_GRUBU}}</td>
                    </tr>
                     <tr>
                        <td style="text-align: left; font-weight: bold;">ACİL DURUM TEL</td>
                        <td style="text-align: left;">: {{ACIL_TEL}}</td>
                    </tr>
                </table>
                
                <div style="position: absolute; bottom: 20px; left: 0; width: 100%; text-align: center; font-size: 12px;">
                    <p>Bu dosya CNK Kesici Takımlar A.Ş. mülkiyetindedir. İzinsiz kopyalanamaz.</p>
                </div>
            </div>
        `,
        dynamicFields: [
            { key: "SICIL_NO", label: "Sicil Numarası", type: "text" },
            { key: "ISE_GIRIS_TARIHI", label: "İşe Giriş Tarihi", type: "date" },
            { key: "KAN_GRUBU", label: "Kan Grubu", type: "text" },
            { key: "ACIL_TEL", label: "Acil Durum Telefonu", type: "text" }
        ]
    },
    {
        id: "fazla_mesai_onay",
        title: "Fazla Mesai Onay Formu (Muvafakatname)",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            
            <h3 style="text-align: center; text-decoration: underline; margin-bottom: 20px;">FAZLA ÇALIŞMA VE ULUSAL BAYRAM GENEL TATİL GÜNLERİ ÇALIŞMA MUVAFAKATNAMESİ</h3>
            
            <p><strong>DÖNEM:</strong> {{YIL}} Yılı</p>
            
            <p>İşyerinin iş yoğunluğu, siparişlerin yetiştirilmesi veya zorunlu nedenlerle yapılacak olan fazla çalışmalara katılmayı peşinen kabul ve taahhüt ederim.</p>
            
            <p>4857 sayılı İş Kanunu'nun 41. maddesi ve ilgili yönetmelikler çerçevesinde;</p>
            
            <ol>
                <li>Yıl içerisinde gerektiğinde işverenin talebi üzerine fazla mesai yapmayı,</li>
                <li>Hafta tatili, Ulusal Bayram ve Genel Tatil günlerinde çalışmayı,</li>
                <li>Fazla çalışma ücretimin kanuna uygun olarak (%50 veya %100 zamlı) ödenmesini,</li>
                <li>Bu onayın {{YIL}} yılı sonuna kadar geçerli olduğunu</li>
            </ol>
            
            <p>Kabul ettiğimi beyan ederim.</p>
            
            {{FOOTER}}
        `,
        dynamicFields: [
            { key: "YIL", label: "Yıl", type: "number", placeholder: "2025" }
        ]
    },
    {
        id: "is_kazasi_tutanagi",
        title: "İş Kazası Tespit Tutanağı",
        content: `
            {{HEADER}}
            
            <h3 style="text-align: center; text-decoration: underline;">İŞ KAZASI TESPİT TUTANAĞI</h3>
            
            <table style="width: 100%; border: 1px solid black; border-collapse: collapse;">
                <tr>
                    <td style="border: 1px solid black; padding: 5px; background-color: #eee; font-weight: bold;">Kazazede Adı Soyadı</td>
                    <td style="border: 1px solid black; padding: 5px;">{{AD_SOYAD}}</td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #eee; font-weight: bold;">T.C. Kimlik No</td>
                    <td style="border: 1px solid black; padding: 5px;">{{TC_NO}}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; background-color: #eee; font-weight: bold;">Kaza Tarihi / Saati</td>
                    <td style="border: 1px solid black; padding: 5px;">{{KAZA_TARIHI}} / {{KAZA_SAATI}}</td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #eee; font-weight: bold;">Kaza Yeri</td>
                    <td style="border: 1px solid black; padding: 5px;">{{KAZA_YERI}}</td>
                </tr>
            </table>
            
            <br/>
            
            <div style="border: 1px solid black; padding: 10px;">
                <p><strong>KAZANIN OLUŞ ŞEKLİ (Detaylı Anlatım):</strong></p>
                <p>{{KAZA_ACIKLAMASI}}</p>
            </div>
            
            <br/>
            
            <table style="width: 100%; border: 1px solid black; border-collapse: collapse;">
                <tr>
                    <td style="border: 1px solid black; padding: 5px; background-color: #eee; font-weight: bold;">Yaralanma Var mı?</td>
                    <td style="border: 1px solid black; padding: 5px;">{{YARALANMA_DURUMU}}</td>
                </tr>
                 <tr>
                    <td style="border: 1px solid black; padding: 5px; background-color: #eee; font-weight: bold;">Yapılan İlk Müdahale</td>
                    <td style="border: 1px solid black; padding: 5px;">{{ILK_MUDAHALE}}</td>
                </tr>
                 <tr>
                    <td style="border: 1px solid black; padding: 5px; background-color: #eee; font-weight: bold;">Görgü Tanıkları</td>
                    <td style="border: 1px solid black; padding: 5px;">{{TANIKLAR}}</td>
                </tr>
            </table>
            
            <br/>
            <p>İşbu tutanak, olayın hemen akabinde olay yerinde düzenlenmiştir.</p>
            
            <table style="width: 100%; margin-top: 30px;">
                <tr>
                    <td style="text-align: center;">
                        <p><strong>İşveren Vekili</strong></p>
                        <br/><p>İmza</p>
                    </td>
                    <td style="text-align: center;">
                        <p><strong>Kazazede Personel</strong></p>
                        <br/><p>İmza</p>
                    </td>
                    <td style="text-align: center;">
                        <p><strong>Tanık 1</strong></p>
                        <br/><p>İmza</p>
                    </td>
                     <td style="text-align: center;">
                        <p><strong>Tanık 2</strong></p>
                        <br/><p>İmza</p>
                    </td>
                </tr>
            </table>
        `,
        dynamicFields: [
            { key: "KAZA_TARIHI", label: "Kaza Tarihi", type: "date" },
            { key: "KAZA_SAATI", label: "Kaza Saati", type: "text", placeholder: "09:15" },
            { key: "KAZA_YERI", label: "Kaza Yeri (Bölüm)", type: "text" },
            { key: "KAZA_ACIKLAMASI", label: "Kazanın Oluş Şekli", type: "textarea" },
            { key: "YARALANMA_DURUMU", label: "Yaralanma Durumu / Uzuv", type: "text" },
            { key: "ILK_MUDAHALE", label: "Yapılan İlk Yardım/Hastane", type: "text" },
            { key: "TANIKLAR", label: "Görgü Tanıkları", type: "text" }
        ]
    },
    {
        id: "mazeret_izni",
        title: "Mazeret İzni Talep Formu",
        content: `
            {{HEADER}}
            {{INFO_BLOCK}}
            
            <h3 style="text-align: center; text-decoration: underline;">MAZERET İZNİ TALEP FORMU</h3>
            
            <p>Aşağıda belirttiğim mazeretim nedeniyle, belirtilen tarihlerde izinli sayılmam hususunu onayınıza arz ederim.</p>
            
            <table style="width: 100%; border: 1px solid black; border-collapse: collapse; margin-top: 20px;">
                 <tr>
                    <td style="border: 1px solid black; padding: 10px; font-weight: bold; width: 30%;">İzin Türü</td>
                    <td style="border: 1px solid black; padding: 10px;">{{IZIN_TURU}} (Evlilik, Ölüm, Babalık, Refakat vb.)</td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 10px; font-weight: bold;">Mazeret Açıklaması</td>
                    <td style="border: 1px solid black; padding: 10px;">{{ACIKLAMA}}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 10px; font-weight: bold;">İzin Başlangıç</td>
                    <td style="border: 1px solid black; padding: 10px;">{{BASLANGIC}}</td>
                </tr>
                 <tr>
                    <td style="border: 1px solid black; padding: 10px; font-weight: bold;">İşe Dönüş</td>
                    <td style="border: 1px solid black; padding: 10px;">{{DONUS}}</td>
                </tr>
                 <tr>
                    <td style="border: 1px solid black; padding: 10px; font-weight: bold;">Toplam Süre</td>
                    <td style="border: 1px solid black; padding: 10px;">{{SURE}} Gün/Saat</td>
                </tr>
            </table>
            
            {{FOOTER}}
        `,
        dynamicFields: [
            { key: "IZIN_TURU", label: "İzin Türü", type: "text", placeholder: "Ölüm İzni" },
            { key: "ACIKLAMA", label: "Açıklama (Yakınlık derecesi vb.)", type: "textarea" },
            { key: "BASLANGIC", label: "Başlangıç Tarihi/Saati", type: "text" },
            { key: "DONUS", label: "İşe Dönüş Tarihi/Saati", type: "text" },
            { key: "SURE", label: "Süre", type: "text" }
        ]
    }
];
