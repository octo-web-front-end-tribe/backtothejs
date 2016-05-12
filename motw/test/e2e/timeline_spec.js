describe('Protractor Demo App', function() {
    it('should have a title and display content in popin', function() {
        browser.get('http://localhost:63342/motw/index.html');
        expect(browser.getTitle()).toEqual('Back to the Javascript');
        browser.actions().click(element.all(by.css('rect')).get(0).getWebElement()).perform();
        browser.driver.sleep(2000);
        browser.executeScript('window.scrollTo(0,0);').then(function () {
            browser.driver.sleep(2000);
            var canvas = element(by.id("main-canvas"));
            browser.actions()
                .mouseMove(canvas, {x: 600, y: 600})
                .click()
                .perform();
            //expect(element(by.css('h2.title')).getText()).toEqual('NodeJS');
        });
    });
});