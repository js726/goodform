#!/bin/sh
# Figma asset links expire after 7 days. Run once from the project root: sh scripts/download-images.sh
mkdir -p public/images
A=https://www.figma.com/api/mcp/asset/2614ad6b-00b1-49ac-98ce-10f69f830871
B=https://www.figma.com/api/mcp/asset/0940b9db-f513-4247-a27e-3a22466c1d82
curl -fL $A/bd4c0.png -o public/images/countryside.png
curl -fL $A/615ba.png -o public/images/forma.png
curl -fL $A/15ed2.png -o public/images/common-ground.png
curl -fL $A/2befd.png -o public/images/portrait.png
curl -fL $B/0466b.png -o public/images/courtyard.png
curl -fL $B/a5b9d.png -o public/images/modern-house.png
curl -fL $B/4ecef.png -o public/images/kip.png
