const puppeteer=require('puppeteer');
const express = require('express');

const router = express.Router();

router.use(function (req,res,next){
    console.log('Arizona Router');
    next();
})
//0492 test license - name - john

router.get('/:lic_id',  function(req, res){
    var lic_id = req.params.lic_id;
    var is_api = req.query.is_api;

    (async (lno = `${lic_id}`) => {
        console.log(lno);
        const browser = await puppeteer.launch({headless: true,args:['--no-sandbox']});
        try{
            const page = await browser.newPage();

            await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: './excel'});
            await page.goto('https://azbodprod.glsuite.us/GLSuiteWeb/clients/azbod/public/WebVerificationSearch.aspx');
            await page.click('input[id="ContentPlaceHolder1_rbDentist"]');
            await page.$eval('input[id="ContentPlaceHolder1_tbProLicNum"]', (el, value) => el.value = value, lic_id);
            await page.click('input[id="ContentPlaceHolder1_btnPro"]');
            await page.waitFor(10000);

            let urls = await page.evaluate(() => {
                let result = "";
                var items = document.getElementsByTagName('a');

                result = items[4].href;
                return result;
            })
            console.log(urls);
            await page.goto(urls);

            let person_details = await page.evaluate(() => {
                const ths = document.getElementById('ContentPlaceHolder1_dtgGeneralN');
                const tds = Array.from(ths.querySelectorAll('tbody tr td'));

                return tds.map(td => td.innerText);
            });
            let license_details = await page.evaluate(() => {
                const ths = document.getElementById('ContentPlaceHolder1_dtgGeneral');
                const tds = Array.from(ths.querySelectorAll('tbody tr td'));

                return tds.map(td => td.innerText);
            });
            let education_details = await page.evaluate(() => {
                const ths = document.getElementById('ContentPlaceHolder1_dtgEducation');
                const tds = Array.from(ths.querySelectorAll('tbody tr td'));

                return tds.map(td => td.innerText);
            })
            let disciplinary_actions = await page.evaluate(() => {
                try {
                    const ths = document.getElementById('ContentPlaceHolder1_dtgDisciplinaryBoardActions');
                    const tds = Array.from(ths.querySelectorAll('tbody tr td'));
                    return 'Yes';
                } catch (error) {
                    return 'No';
                }
            })
            console.log(person_details);
            console.log(license_details);
            console.log(education_details);
            console.log(disciplinary_actions);
            //await page.click('a[href="WebVerificationProfileDetailsPRO.aspx?EntityID=1403943&LicenseID=97776&LicType=1872"]')
            await page.waitFor(10000);
            var result = {
                "Name": person_details[0],
                "Status": license_details[3],
                "ExpiryDate": license_details[9],
                "DisciplinaryAction": disciplinary_actions
            };
            if (is_api == "true") {
                res.status(200).send(JSON.stringify(result));
            } else {
                res.render('pages/status', {result: JSON.stringify(result)});
            }
        } catch (err) {
            console.error(err.message);
            res.send(404);
        } finally {
            await browser.close();
        }
    })();
});

module.exports = router;