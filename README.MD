# Define a rules path like so which returns a response payload of { searchReplaceRules: [], regexRules: [] }

RULES_PATH=https://yourhost.com/rules

To pull down .env
https://www.dotenv.org/docs/tutorials/sync

```
xcrun notarytool submit out/make/zip/darwin/arm64/Beautify-darwin-arm64-0.1.0.zip --apple-id "I" --password "P" --team-id "T"
xcrun notarytool info "9" --apple-id "I" --password "P" --team-id "T"

# Staple the Ticket: Once the notarization is successful, run the following command to staple the notarization ticket to your app:
xcrun stapler staple out/make/zip/darwin/arm64/Beautify.app

# Verify: To confirm that the notarization and stapling were successful, run:
spctl -a -v --type execute out/make/zip/darwin/arm64/Beautify.app
```

# https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution/customizing_the_notarization_workflow
