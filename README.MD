[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/6231da10-8efe-47dc-b253-6cf8a3e7e6e9.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/6231da10-8efe-47dc-b253-6cf8a3e7e6e9)

```
xcrun notarytool submit out/make/zip/darwin/arm64/Beautify-darwin-arm64-0.1.0.zip --apple-id "I" --password "P" --team-id "T"
xcrun notarytool info "9" --apple-id "I" --password "P" --team-id "T"

# Staple the Ticket: Once the notarization is successful, run the following command to staple the notarization ticket to your app:
xcrun stapler staple out/make/zip/darwin/arm64/Beautify.app

# Verify: To confirm that the notarization and stapling were successful, run:
spctl -a -v --type execute out/make/zip/darwin/arm64/Beautify.app
```

# https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution/customizing_the_notarization_workflow
